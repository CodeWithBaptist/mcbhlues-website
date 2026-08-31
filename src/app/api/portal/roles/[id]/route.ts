import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { canManageLevel } from "@/lib/rbac/permissions";

/**
 * PATCH /api/portal/roles/:id — rename a role and/or replace its permission
 * set. Requires role:update.
 */
export const PATCH = withPermission("role:update", async (request, { params, user }) => {
  const { id } = await params;
  const db = await getDb();
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });

  if (!canManageLevel(user, role.level)) {
    return NextResponse.json(
      { error: "You cannot modify a role at or above your own level." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.description === "string") patch.description = body.description.trim();
  if (Number.isFinite(body?.level) && !role.isSystem) {
    const level = Number(body.level);
    if (!canManageLevel(user, level)) {
      return NextResponse.json({ error: "Level exceeds your own." }, { status: 403 });
    }
    patch.level = level;
  }

  await db.update(roles).set(patch).where(eq(roles.id, id));

  let permissionChange: { added: string[]; removed: string[] } | null = null;
  if (Array.isArray(body?.permissions)) {
    if (!user.permissions.includes("permission:update") && !user.permissions.includes("role:update")) {
      return NextResponse.json({ error: "Not permitted." }, { status: 403 });
    }

    const requested: string[] = body.permissions.map(String);
    const catalogue = await db.select().from(permissions);
    const validKeys = new Set(catalogue.map((row) => row.key));
    const next = requested.filter((key) => validKeys.has(key));

    const escalating = next.filter((key) => !user.permissions.includes(key));
    if (escalating.length > 0) {
      return NextResponse.json(
        { error: "You cannot grant permissions you do not hold.", requiredPermissions: escalating },
        { status: 403 }
      );
    }

    const current = await db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, id));
    const currentKeys = current.map((row) => row.key);

    // Guard against locking the platform out of its own administration.
    if (role.key === "super_admin") {
      const criticalLost = ["role:update", "staff:read", "permission:read"].filter(
        (key) => !next.includes(key)
      );
      if (criticalLost.length > 0) {
        return NextResponse.json(
          { error: "The Super Admin role must retain core administration permissions." },
          { status: 400 }
        );
      }
    }

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    const values = catalogue
      .filter((row) => next.includes(row.key))
      .map((row) => ({ roleId: id, permissionId: row.id }));
    if (values.length > 0) await db.insert(rolePermissions).values(values);

    permissionChange = {
      added: next.filter((key) => !currentKeys.includes(key)),
      removed: currentKeys.filter((key) => !next.includes(key)),
    };
  }

  await recordAudit({
    actor: user,
    action: permissionChange ? AUDIT_ACTIONS.ROLE_PERMISSIONS_CHANGED : AUDIT_ACTIONS.ROLE_UPDATED,
    resource: "role",
    resourceId: id,
    metadata: { roleKey: role.key, ...(permissionChange ?? {}) },
  });

  return NextResponse.json({ ok: true });
});

/** DELETE /api/portal/roles/:id — requires role:delete. System roles are protected. */
export const DELETE = withPermission("role:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const db = await getDb();
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSystem) {
    return NextResponse.json({ error: "System roles cannot be deleted." }, { status: 400 });
  }
  if (!canManageLevel(user, role.level)) {
    return NextResponse.json({ error: "You cannot delete this role." }, { status: 403 });
  }

  const members = await db.select().from(userRoles).where(eq(userRoles.roleId, id));
  if (members.length > 0) {
    return NextResponse.json(
      { error: `This role is still assigned to ${members.length} staff member(s).` },
      { status: 400 }
    );
  }

  await db.delete(roles).where(eq(roles.id, id));
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ROLE_DELETED,
    resource: "role",
    resourceId: id,
    metadata: { roleKey: role.key },
  });

  return NextResponse.json({ ok: true });
});
