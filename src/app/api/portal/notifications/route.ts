import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import {
  createNotification,
  listNotificationsForUser,
  unreadCountForUser,
} from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/notifications — the caller's feed + unread count. */
export const GET = withPermission("notification:read", async (_request, { user }) => {
  const [list, unread] = await Promise.all([
    listNotificationsForUser(user.id),
    unreadCountForUser(user.id),
  ]);
  return NextResponse.json({ notifications: list, unread });
});

/**
 * POST /api/portal/notifications — broadcast or target a notification.
 * Requires notification:manage.
 */
export const POST = withPermission("notification:manage", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const userId = typeof body?.userId === "string" && body.userId ? body.userId : null;
  await createNotification({
    userId,
    title,
    body: typeof body?.body === "string" ? body.body : "",
    kind: typeof body?.kind === "string" ? body.kind : "info",
    link: typeof body?.link === "string" ? body.link : "",
    createdBy: user.id,
  });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.NOTIFICATION_CREATED,
    resource: "notification",
    metadata: { title, broadcast: !userId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});
