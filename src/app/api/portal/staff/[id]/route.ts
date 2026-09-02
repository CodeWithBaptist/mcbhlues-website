import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff } from "@/lib/rbac/staff-service";
import { revokeUserSessions } from "@/lib/auth/session";

/** PATCH /api/portal/staff/:id — edit staff details. Requires staff:update. */
export const PATCH = withPermission("staff:update", async (request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const body = await request.json().catch(() => null);
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body?.firstName === "string") patch.firstName = body.firstName.trim();
  if (typeof body?.lastName === "string") patch.lastName = body.lastName.trim();
  if (typeof body?.phone === "string") patch.phone = body.phone.trim();

  if (patch.firstName !== undefined && patch.firstName === "") {
    return NextResponse.json({ error: "First name cannot be empty." }, { status: 400 });
  }
  if (patch.lastName !== undefined && patch.lastName === "") {
    return NextResponse.json({ error: "Last name cannot be empty." }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_UPDATED,
    resource: "user",
    resourceId: id,
    metadata: { fields: Object.keys(patch).filter((key) => key !== "updatedAt") },
  });

  const { passwordHash: _passwordHash, ...safeStaff } = updated;
  return NextResponse.json({ staff: safeStaff });
});

/** DELETE /api/portal/staff/:id — remove a staff account. Requires staff:delete. */
export const DELETE = withPermission("staff:delete", async (_request, { params, user }) => {
  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot remove your own account." }, { status: 400 });
  }
  await assertCanAdministerStaff(user, id);

  const db = await getDb();
  const [removed] = await db.delete(users).where(eq(users.id, id)).returning();
  if (!removed) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  await revokeUserSessions(id).catch(() => undefined);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_REMOVED,
    resource: "user",
    resourceId: id,
    metadata: { email: removed.email },
  });

  return NextResponse.json({ ok: true });
});
