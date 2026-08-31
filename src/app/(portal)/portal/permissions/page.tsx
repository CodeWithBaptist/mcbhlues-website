import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { PermissionsManager } from "@/components/portal/permissions-manager";
import { loadRolesWithPermissions } from "@/lib/rbac/role-service";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const access = await pageAccess("permission:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const [permissionRows, roleRows] = await Promise.all([
    db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.key)),
    loadRolesWithPermissions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="The permission catalogue. Add custom permissions here and attach them to any role."
      />
      <PermissionsManager
        permissions={permissionRows.map((row) => ({
          key: row.key,
          module: row.module,
          description: row.description,
          isSystem: row.isSystem,
        }))}
        roles={roleRows.map((role) => ({
          key: role.key,
          name: role.name,
          permissions: role.permissions,
        }))}
      />
    </div>
  );
}
