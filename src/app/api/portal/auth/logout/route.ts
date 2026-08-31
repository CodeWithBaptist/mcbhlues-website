import { NextResponse } from "next/server";
import { destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.LOGOUT,
      resource: "user",
      resourceId: user.id,
    });
  }
  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
