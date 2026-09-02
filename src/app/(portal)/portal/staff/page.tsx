import { asc } from "drizzle-orm";
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { getDb } from "@/db";
import { permissions, roles } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { listStaff } from "@/lib/rbac/staff-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { HeroMeta, PageHero } from "@/components/portal/ui";
import { StaffManager } from "@/components/portal/staff-manager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const access = await pageAccess("staff:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const [staff, roleRows, permissionRows] = await Promise.all([
    listStaff(),
    db.select().from(roles).orderBy(asc(roles.level)),
    db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.key)),
  ]);

  return (
    <div>
      <PageHero
        kicker="Administration"
        title="Staff Management"
        description="Create accounts, send invitations, assign roles and fine-tune individual permissions for every member of the team."
        icon={<Users className="h-6 w-6" />}
      >
        <HeroMeta
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Your clearance"
          value={`Level ${access.user.level}`}
        />
        <HeroMeta
          icon={<KeyRound className="h-4 w-4" />}
          label="You hold"
          value={`${access.user.permissions.length} permissions`}
        />
      </PageHero>
      <StaffManager
        initialStaff={staff.map((row) => ({
          ...row,
          lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        }))}
        roles={roleRows.map((row) => ({
          id: row.id,
          key: row.key,
          name: row.name,
          level: row.level,
          isAssignable: row.isAssignable,
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
