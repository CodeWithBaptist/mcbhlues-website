import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications, userRoles, rolePermissions, permissions } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";

export interface NotificationRow {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  kind: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface CreateNotificationInput {
  title: string;
  body?: string;
  kind?: string;
  link?: string;
  /** When set, the notification is private to this user; otherwise broadcast. */
  userId?: string | null;
  createdBy?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const db = await getDb();
  await db.insert(notifications).values({
    userId: input.userId ?? null,
    title: input.title,
    body: input.body ?? "",
    kind: input.kind ?? "info",
    link: input.link ?? "",
    createdBy: input.createdBy ?? null,
  });
}

/**
 * Sends a notification to every staff member holding one of the given
 * permission keys (used for workflow events like "new enquiry arrived").
 */
export async function notifyPermissionHolders(
  permissionKeys: string[],
  input: Omit<CreateNotificationInput, "userId">
): Promise<void> {
  const db = await getDb();
  const permRows = await db
    .selectDistinct({ userId: userRoles.userId, key: permissions.key })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(permissions.key, permissionKeys));

  const holderIds = [...new Set(permRows.map((row) => row.userId))];
  for (const userId of holderIds) {
    await db.insert(notifications).values({
      userId,
      title: input.title,
      body: input.body ?? "",
      kind: input.kind ?? "info",
      link: input.link ?? "",
      createdBy: input.createdBy ?? null,
    });
  }
}

/** The feed visible to a user: broadcasts plus anything addressed to them. */
export async function listNotificationsForUser(userId: string, limit = 100): Promise<NotificationRow[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(or(isNull(notifications.userId), eq(notifications.userId, userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    body: row.body,
    kind: row.kind,
    link: row.link,
    read: (row.readBy ?? []).includes(userId),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function unreadCountForUser(userId: string): Promise<number> {
  const list = await listNotificationsForUser(userId, 200);
  return list.filter((row) => !row.read).length;
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(notifications)
    .set({ readBy: sql`CASE WHEN ${notifications.readBy} @> ${JSON.stringify([userId])}::jsonb THEN ${notifications.readBy} ELSE (${notifications.readBy} || ${JSON.stringify([userId])}::jsonb) END` })
    .where(and(eq(notifications.id, id), or(isNull(notifications.userId), eq(notifications.userId, userId))));
}

export async function markAllRead(userId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(notifications)
    .set({ readBy: sql`CASE WHEN ${notifications.readBy} @> ${JSON.stringify([userId])}::jsonb THEN ${notifications.readBy} ELSE (${notifications.readBy} || ${JSON.stringify([userId])}::jsonb) END` })
    .where(or(isNull(notifications.userId), eq(notifications.userId, userId)));
}
