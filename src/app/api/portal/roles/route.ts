import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { canManageLevel } from "@/lib/rbac/permissions";
import { loadRolesWithPermissions } from "@/lib/rbac/role-service";

/** GET /api/portal/roles — requires role:read */
export const GET = withPermission("role:read", async () => {
  return NextResponse.json({ roles: await loadRolesWithPermissions() });
});

/** POST /api/portal/roles — create a custom role. Requires role:create. */
export const POST = withPermission("role:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const key = String(body?.key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  const description = String(body?.description ?? "").trim();
  const level = Number.isFinite(body?.level) ? Number(body.level) : 10;
  const permissionKeys: string[] = Array.isArray(body?.permissions) ? body.permissions.map(String) : [];

  if (!name || !key) {
    return NextResponse.json({ error: "Role name and key are required." }, { status: 400 });
  }

  // A role may never be created above the creator's own level, and may never
  // contain a permission the creator does not hold.
  if (!canManageLevel(user, level)) {
    return NextResponse.json(
      { error: "You cannot create a role at or above your own level." },
      { status: 403 }
    );
  }
  const escalating = permissionKeys.filter((permissionKey) => !user.permissions.includes(permissionKey));
  if (escalating.length > 0) {
    return NextResponse.json(
      { error: "You cannot grant permissions you do not hold.", requiredPermissions: escalating },
      { status: 403 }
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
  if (existing) return NextResponse.json({ error: "That role key already exists." }, { status: 409 });

  const [created] = await db
    .insert(roles)
    .values({ key, name, description, level, isSystem: false })
    .returning();

  if (permissionKeys.length > 0) {
    const catalogue = await db.select().from(permissions);
    const values = catalogue
      .filter((row) => permissionKeys.includes(row.key))
      .map((row) => ({ roleId: created.id, permissionId: row.id }));
    if (values.length > 0) await db.insert(rolePermissions).values(values);
  }

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ROLE_CREATED,
    resource: "role",
    resourceId: created.id,
    metadata: { key, level, permissions: permissionKeys },
  });

  return NextResponse.json({ role: created }, { status: 201 });
});
