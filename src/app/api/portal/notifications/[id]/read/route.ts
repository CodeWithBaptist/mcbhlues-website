import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { markNotificationRead } from "@/lib/notifications/notification-service";

/** POST /api/portal/notifications/:id/read — mark one notification read. */
export const POST = withPermission("notification:read", async (_request, { params, user }) => {
  const { id } = await params;
  await markNotificationRead(id, user.id);
  return NextResponse.json({ ok: true });
});
