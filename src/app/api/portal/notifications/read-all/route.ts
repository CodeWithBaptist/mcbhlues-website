import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { markAllRead } from "@/lib/notifications/notification-service";

/** POST /api/portal/notifications/read-all — mark everything read for the caller. */
export const POST = withPermission("notification:read", async (_request, { user }) => {
  await markAllRead(user.id);
  return NextResponse.json({ ok: true });
});
