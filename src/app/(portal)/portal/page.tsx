import { count } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { auditLogs, permissions, roles, users } from "@/db/schema";
import { requireAuth } from "@/lib/rbac/permissions";
import { getNavigationForUser } from "@/lib/rbac/navigation";
import { Card, PageHeader } from "@/components/portal/ui";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const user = await requireAuth();
  const db = await getDb();
  const navigation = await getNavigationForUser(user);

  const canSeeStaff = user.permissions.includes("staff:read");
  const canSeeRoles = user.permissions.includes("role:read");
  const canSeeAudit = user.permissions.includes("audit:read");

  const [staffCount] = canSeeStaff ? await db.select({ value: count() }).from(users) : [{ value: 0 }];
  const [roleCount] = canSeeRoles ? await db.select({ value: count() }).from(roles) : [{ value: 0 }];
  const [permissionCount] = canSeeRoles
    ? await db.select({ value: count() }).from(permissions)
    : [{ value: 0 }];
  const [auditCount] = canSeeAudit
    ? await db.select({ value: count() }).from(auditLogs)
    : [{ value: 0 }];

  const stats = [
    canSeeStaff && { label: "Staff accounts", value: staffCount.value },
    canSeeRoles && { label: "Roles", value: roleCount.value },
    canSeeRoles && { label: "Permissions", value: permissionCount.value },
    canSeeAudit && { label: "Audit entries", value: auditCount.value },
    { label: "Your permissions", value: user.permissions.length },
  ].filter(Boolean) as { label: string; value: number }[];

  const modules = navigation.flatMap((group) => group.items).filter((item) => item.href !== "/portal");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Your portal is tailored to the permissions attached to your role."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Your access" description="Roles assigned to your account" className="lg:col-span-1">
          <ul className="space-y-3">
            {user.roles.length === 0 && (
              <li className="text-sm text-gray-500">No role assigned — contact your administrator.</li>
            )}
            {user.roles.map((role) => (
              <li key={role.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-sm font-semibold text-dark">{role.name}</p>
                <p className="text-xs text-gray-500">
                  <code>{role.key}</code> · level {role.level}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Modules available to you"
          description="Navigation is generated from the database and filtered by permission"
          className="lg:col-span-2"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            {modules.length === 0 && (
              <p className="text-sm text-gray-500">No additional modules are available to your role.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
