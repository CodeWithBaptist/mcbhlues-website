import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { RolesManager } from "@/components/portal/roles-manager";
import { loadRolesWithPermissions } from "@/lib/rbac/role-service";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const access = await pageAccess("role:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const [roleRows, permissionRows] = await Promise.all([
    loadRolesWithPermissions(),
    db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.key)),
  ]);

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Roles are stored in the database. Change a role's permissions and every member inherits the change."
      />
      <RolesManager
        roles={roleRows.map((role) => ({
          id: role.id,
          key: role.key,
          name: role.name,
          description: role.description,
          level: role.level,
          isSystem: role.isSystem,
          memberCount: role.memberCount,
          permissions: role.permissions,
        }))}
        permissions={permissionRows.map((row) => ({
          key: row.key,
          module: row.module,
          description: row.description,
        }))}
      />
    </div>
  );
}
