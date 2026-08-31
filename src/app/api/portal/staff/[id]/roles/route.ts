import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { roles, userRoles } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff, assertCanAssignRole } from "@/lib/rbac/staff-service";
import { revokeUserSessions } from "@/lib/auth/session";

/** POST /api/portal/staff/:id/roles — assign a role. Requires staff:assign_role. */
export const POST = withPermission("staff:assign_role", async (request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const body = await request.json().catch(() => null);
  const roleId = String(body?.roleId ?? "");
  const role = await assertCanAssignRole(user, roleId);

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, id), eq(userRoles.roleId, roleId)))
    .limit(1);

  if (!existing) {
    await db.insert(userRoles).values({ userId: id, roleId, assignedBy: user.id });
    await revokeUserSessions(id).catch(() => undefined);
  }

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_ROLE_CHANGED,
    resource: "user",
    resourceId: id,
    metadata: { change: "assigned", roleKey: role.key, roleId },
  });

  return NextResponse.json({ ok: true });
});

/** DELETE /api/portal/staff/:id/roles?roleId=... — remove a role. Requires staff:remove_role. */
export const DELETE = withPermission("staff:remove_role", async (request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const roleId = request.nextUrl.searchParams.get("roleId") ?? "";
  if (!roleId) return NextResponse.json({ error: "roleId is required." }, { status: 400 });

  const db = await getDb();
  const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });

  await db.delete(userRoles).where(and(eq(userRoles.userId, id), eq(userRoles.roleId, roleId)));
  await revokeUserSessions(id).catch(() => undefined);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_ROLE_CHANGED,
    resource: "user",
    resourceId: id,
    metadata: { change: "removed", roleKey: role.key, roleId },
  });

  return NextResponse.json({ ok: true });
});
