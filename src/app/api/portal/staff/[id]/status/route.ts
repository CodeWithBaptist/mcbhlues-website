import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff } from "@/lib/rbac/staff-service";
import { revokeUserSessions } from "@/lib/auth/session";

/** POST /api/portal/staff/:id/status — activate / deactivate. Requires staff:disable. */
export const POST = withPermission("staff:disable", async (request, { params, user }) => {
  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot change your own account status." }, { status: 400 });
  }
  await assertCanAdministerStaff(user, id);

  const body = await request.json().catch(() => null);
  const status = body?.status === "active" ? "active" : "disabled";

  const db = await getDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  if (status === "active" && !target.passwordHash) {
    return NextResponse.json(
      { error: "This account has not accepted its invitation yet." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  // Disabling must take effect immediately, not at session expiry.
  if (status !== "active") await revokeUserSessions(id);

  await recordAudit({
    actor: user,
    action: status === "active" ? AUDIT_ACTIONS.STAFF_ENABLED : AUDIT_ACTIONS.STAFF_DISABLED,
    resource: "user",
    resourceId: id,
    metadata: { email: target.email, status },
  });

  const { passwordHash: _passwordHash, ...safeStaff } = updated;
  return NextResponse.json({ staff: safeStaff });
});
