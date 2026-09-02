import { asc } from "drizzle-orm";
import { Boxes, KeyRound, ShieldCheck } from "lucide-react";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { HeroMeta, PageHero } from "@/components/portal/ui";
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

  const moduleCount = new Set(permissionRows.map((row) => row.module)).size;

  return (
    <div>
      <PageHero
        kicker="Administration"
        title="Permissions Catalogue"
        description="Every capability in the portal is a permission key. Add custom permissions here and attach them to any role."
        icon={<KeyRound className="h-6 w-6" />}
      >
        <HeroMeta
          icon={<Boxes className="h-4 w-4" />}
          label="Modules"
          value={`${moduleCount}`}
        />
        <HeroMeta
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Roles in matrix"
          value={`${roleRows.length}`}
        />
      </PageHero>
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
