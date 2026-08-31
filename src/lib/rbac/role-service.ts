import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";

/** Roles with their permission keys and member counts, straight from the DB. */
export async function loadRolesWithPermissions() {
  const db = await getDb();
  const roleRows = await db.select().from(roles).orderBy(asc(roles.level));
  const mappings = await db
    .select({ roleId: rolePermissions.roleId, key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId));
  const members = await db.select({ roleId: userRoles.roleId }).from(userRoles);

  return roleRows.map((role) => ({
    ...role,
    permissions: mappings.filter((row) => row.roleId === role.id).map((row) => row.key).sort(),
    memberCount: members.filter((row) => row.roleId === role.id).length,
  }));
}

