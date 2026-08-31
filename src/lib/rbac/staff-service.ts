import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations, roles, userRoles, users } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/auth/password";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { AuthError, canManageLevel } from "@/lib/rbac/permissions";

export const INVITE_TTL_HOURS = 72;

export interface StaffRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { id: string; key: string; name: string; level: number }[];
  level: number;
}

export async function listStaff(): Promise<StaffRecord[]> {
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(users.createdAt);
  if (rows.length === 0) return [];

  const assignments = await db
    .select({
      userId: userRoles.userId,
      id: roles.id,
      key: roles.key,
      name: roles.name,
      level: roles.level,
    })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(
      inArray(
        userRoles.userId,
        rows.map((row) => row.id)
      )
    );

  return rows.map((row) => {
    const assigned = assignments
      .filter((entry) => entry.userId === row.id)
      .map(({ userId: _userId, ...role }) => role);
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      status: row.status,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      roles: assigned,
      level: assigned.reduce((max, role) => Math.max(max, role.level), 0),
    };
  });
}

export async function getStaffLevel(userId: string): Promise<number> {
  const db = await getDb();
  const assigned = await db
    .select({ level: roles.level })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
  return assigned.reduce((max, role) => Math.max(max, role.level), 0);
}

/**
 * Hierarchy check for staff administration. Prevents, for example, an Admin
 * from editing, disabling or re-roling a Super Admin account — driven by the
 * `roles.level` column rather than a hardcoded role name.
 */
export async function assertCanAdministerStaff(actor: AuthenticatedUser, targetUserId: string) {
  if (actor.id === targetUserId) return;
  const targetLevel = await getStaffLevel(targetUserId);
  if (!canManageLevel(actor, targetLevel)) {
    throw new AuthError(
      "You cannot manage an account at or above your own role level.",
      403,
      "FORBIDDEN"
    );
  }
}

export async function assertCanAssignRole(actor: AuthenticatedUser, roleId: string) {
  const db = await getDb();
  const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) {
    throw new AuthError("Role not found.", 403, "FORBIDDEN");
  }
  if (!role.isAssignable) {
    throw new AuthError("This role cannot be assigned.", 403, "FORBIDDEN");
  }
  if (!canManageLevel(actor, role.level)) {
    throw new AuthError(
      "You cannot assign a role at or above your own level.",
      403,
      "FORBIDDEN"
    );
  }
  return role;
}

/** Issues a single-use invitation token; previous open invites are revoked. */
export async function issueInvitation(userId: string, email: string, invitedBy: string) {
  const db = await getDb();
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(invitations.userId, userId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt)
      )
    );

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
  await db.insert(invitations).values({
    userId,
    email,
    tokenHash: hashToken(token),
    expiresAt,
    invitedBy,
  });

  return { token, expiresAt, url: `/portal/invite/${token}` };
}
