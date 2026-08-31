import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  permissions,
  rolePermissions,
  roles,
  sessions,
  userPermissions,
  userRoles,
  users,
} from "@/db/schema";
import { generateToken, hashToken } from "./password";

export const SESSION_COOKIE = "mcbhlues_staff_session";
const SESSION_TTL_HOURS = 12;

export interface AuthenticatedRole {
  id: string;
  key: string;
  name: string;
  level: number;
}

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  roles: AuthenticatedRole[];
  /** Highest role level held — used for hierarchy checks, never for feature gating. */
  level: number;
  /** Effective permission keys: role permissions + individual allows - individual denies. */
  permissions: string[];
  sessionId: string;
}

async function requestMeta() {
  const headerList = await headers();
  return {
    ip:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      "",
    userAgent: headerList.get("user-agent") ?? "",
  };
}

/* -------------------------------------------------------------------------- */
/*  Effective permission resolution                                            */
/* -------------------------------------------------------------------------- */

export async function resolveUserPermissions(userId: string): Promise<string[]> {
  const db = await getDb();

  const fromRoles = await db
    .select({ key: permissions.key })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(userRoles.userId, userId));

  const overrides = await db
    .select({ key: permissions.key, effect: userPermissions.effect })
    .from(userPermissions)
    .innerJoin(permissions, eq(permissions.id, userPermissions.permissionId))
    .where(eq(userPermissions.userId, userId));

  const effective = new Set(fromRoles.map((row) => row.key));
  for (const row of overrides) {
    if (row.effect === "allow") effective.add(row.key);
  }
  // Deny always wins, whatever the role grants.
  for (const row of overrides) {
    if (row.effect === "deny") effective.delete(row.key);
  }

  return [...effective].sort();
}

export async function loadUserRoles(userId: string): Promise<AuthenticatedRole[]> {
  const db = await getDb();
  return db
    .select({ id: roles.id, key: roles.key, name: roles.name, level: roles.level })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
}

/* -------------------------------------------------------------------------- */
/*  Session lifecycle                                                          */
/* -------------------------------------------------------------------------- */

export async function createSession(userId: string) {
  const db = await getDb();
  const token = generateToken();
  const { ip, userAgent } = await requestMeta();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: ip,
    userAgent,
  });

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Revoke every active session for a user (used on disable / password reset). */
export async function revokeUserSessions(userId: string) {
  const db = await getDb();
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * The single source of truth for "who is calling?". Memoised per request.
 * Returns null for anonymous, expired, revoked or disabled accounts.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const [row] = await db
    .select({
      sessionId: sessions.id,
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, sql`now()`)
      )
    )
    .limit(1);

  if (!row || row.status !== "active") return null;

  const [userRoleList, permissionKeys] = await Promise.all([
    loadUserRoles(row.id),
    resolveUserPermissions(row.id),
  ]);

  return {
    ...row,
    roles: userRoleList,
    level: userRoleList.reduce((max, role) => Math.max(max, role.level), 0),
    permissions: permissionKeys,
  };
});
