import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions, userPermissions } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff } from "@/lib/rbac/staff-service";
import { resolveUserPermissions, revokeUserSessions } from "@/lib/auth/session";

/** GET — individual permission overrides for a staff member. */
export const GET = withPermission(
  ["staff:manage_permissions", "staff:read"],
  async (_request, { params }) => {
    const { id } = await params;
    const db = await getDb();
    const overrides = await db
      .select({ key: permissions.key, effect: userPermissions.effect })
      .from(userPermissions)
      .innerJoin(permissions, eq(permissions.id, userPermissions.permissionId))
      .where(eq(userPermissions.userId, id));
    return NextResponse.json({ overrides, effective: await resolveUserPermissions(id) });
  },
  "all"
);

/**
 * PUT — replace the individual permission overrides for a staff member.
 * Body: { overrides: [{ key, effect: "allow" | "deny" }] }
 * Requires staff:manage_permissions.
 */
export const PUT = withPermission("staff:manage_permissions", async (request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const body = await request.json().catch(() => null);
  const incoming: { key: string; effect: string }[] = Array.isArray(body?.overrides)
    ? body.overrides
    : [];

  const db = await getDb();
  const catalogue = await db.select().from(permissions);
  const byKey = new Map(catalogue.map((row) => [row.key, row.id]));

  const values = incoming
    .filter((row) => byKey.has(row.key) && (row.effect === "allow" || row.effect === "deny"))
    .map((row) => ({
      userId: id,
      permissionId: byKey.get(row.key)!,
      effect: row.effect,
      grantedBy: user.id,
    }));

  // A grantor can never hand out a permission they do not themselves hold.
  const escalating = values
    .filter((row) => row.effect === "allow")
    .map((row) => catalogue.find((entry) => entry.id === row.permissionId)!.key)
    .filter((key) => !user.permissions.includes(key));

  if (escalating.length > 0) {
    return NextResponse.json(
      {
        error: "You cannot grant permissions you do not hold yourself.",
        code: "FORBIDDEN",
        requiredPermissions: escalating,
      },
      { status: 403 }
    );
  }

  await db.delete(userPermissions).where(eq(userPermissions.userId, id));
  if (values.length > 0) await db.insert(userPermissions).values(values);
  await revokeUserSessions(id).catch(() => undefined);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_PERMISSIONS_CHANGED,
    resource: "user",
    resourceId: id,
    metadata: { overrides: incoming },
  });

  return NextResponse.json({ ok: true, effective: await resolveUserPermissions(id) });
});
