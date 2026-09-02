import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import {
  activityLogs,
  auditLogs,
  bookings,
  enquiries,
  permissions,
  properties,
  roles,
  users,
} from "@/db/schema";
import { requireAuth } from "@/lib/rbac/permissions";
import { getNavigationForUser } from "@/lib/rbac/navigation";
import { getMaintenanceMode } from "@/lib/settings/system-config";
import { Card, PageHeader } from "@/components/portal/ui";
import { DashboardHero } from "@/components/portal/dashboard-hero";
import { StatCard } from "@/components/portal/stat-card";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { QuickActions } from "@/components/portal/quick-actions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const user = await requireAuth();
  const db = await getDb();
  const navigation = await getNavigationForUser(user);
  const maintenance = await getMaintenanceMode();

  const canSeeStaff = user.permissions.includes("staff:read");
  const canSeeRoles = user.permissions.includes("role:read");
  const canSeeAudit = user.permissions.includes("audit:read");
  const canSeeProperties = user.permissions.some((key) => key.startsWith("property:read"));
  const canSeeEnquiries = user.permissions.includes("enquiry:read");
  const canSeeBookings = user.permissions.includes("booking:read");

  const zero = [{ value: 0 }];
  const [staffCount] = canSeeStaff ? await db.select({ value: count() }).from(users) : zero;
  const [roleCount] = canSeeRoles ? await db.select({ value: count() }).from(roles) : zero;
  const [permissionCount] = canSeeRoles
    ? await db.select({ value: count() }).from(permissions)
    : zero;
  const [auditCount] = canSeeAudit ? await db.select({ value: count() }).from(auditLogs) : zero;

  const [propertyCount] = canSeeProperties
    ? await db.select({ value: count() }).from(properties)
    : zero;
  const [publishedCount] = canSeeProperties
    ? await db.select({ value: count() }).from(properties).where(eq(properties.isPublished, true))
    : zero;
  const [portfolioValue] = canSeeProperties
    ? await db
        .select({ value: sql<number>`coalesce(sum(${properties.price}), 0)` })
        .from(properties)
        .where(eq(properties.status, "available"))
    : [{ value: 0 }];

  const [openEnquiries] = canSeeEnquiries
    ? await db.select({ value: count() }).from(enquiries).where(eq(enquiries.status, "new"))
    : zero;
  const [upcomingBookings] = canSeeBookings
    ? await db
        .select({ value: count() })
        .from(bookings)
        .where(and(gt(bookings.scheduledAt, new Date()), eq(bookings.status, "confirmed")))
    : zero;

  const stats = [
    canSeeProperties && {
      label: "Listings",
      value: String(propertyCount.value),
      hint: `${publishedCount.value} published`,
      icon: "Building2",
      tone: "primary" as const,
      href: "/portal/properties",
    },
    canSeeProperties && {
      label: "Available portfolio",
      value: formatCurrency(Number(portfolioValue?.value ?? 0), "NGN", { compact: true }),
      hint: "Total asking value",
      icon: "TrendingUp",
      tone: "emerald" as const,
      href: "/portal/properties",
    },
    canSeeEnquiries && {
      label: "New enquiries",
      value: String(openEnquiries.value),
      hint: "Awaiting a first response",
      icon: "MessageSquare",
      tone: "amber" as const,
      href: "/portal/enquiries",
    },
    canSeeBookings && {
      label: "Upcoming viewings",
      value: String(upcomingBookings.value),
      hint: "Confirmed and scheduled",
      icon: "CalendarClock",
      tone: "violet" as const,
      href: "/portal/bookings",
    },
    canSeeStaff && {
      label: "Staff accounts",
      value: String(staffCount.value),
      hint: `${roleCount.value} roles`,
      icon: "Users",
      tone: "sky" as const,
      href: "/portal/staff",
    },
    canSeeAudit && {
      label: "Audit entries",
      value: String(auditCount.value),
      hint: "Every change is recorded",
      icon: "ShieldCheck",
      tone: "rose" as const,
      href: "/portal/audit-logs",
    },
    {
      label: "Your permissions",
      value: String(user.permissions.length),
      hint: `${permissionCount.value || user.permissions.length} defined in total`,
      icon: "KeyRound",
      tone: "slate" as const,
      href: "/portal/permissions",
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    hint: string;
    icon: string;
    tone: "primary" | "emerald" | "amber" | "violet" | "sky" | "rose" | "slate";
    href: string;
  }[];

  const recentActivity = user.permissions.includes("log:read")
    ? await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8)
    : await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.userId, user.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(8);

  const modules = navigation.flatMap((group) => group.items).filter((item) => item.href !== "/portal");

  return (
    <div className="space-y-6">
      {maintenance.enabled && (
        <div className="portal-enter rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">Maintenance mode is on</p>
          <p className="mt-0.5 text-sm text-amber-800">{maintenance.message}</p>
        </div>
      )}

      <DashboardHero
        firstName={user.firstName}
        roles={user.roles.map((role) => role.name)}
        permissionCount={user.permissions.length}
        moduleCount={modules.length}
      />

      <div className="portal-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <QuickActions
        actions={[
          canSeeProperties && { label: "Add a listing", href: "/portal/properties", icon: "Building2" },
          canSeeEnquiries && { label: "Review enquiries", href: "/portal/enquiries", icon: "MessageSquare" },
          canSeeBookings && { label: "Schedule a viewing", href: "/portal/bookings", icon: "CalendarClock" },
          user.permissions.includes("media:upload") && {
            label: "Upload media",
            href: "/portal/media",
            icon: "ImagePlus",
          },
          canSeeStaff && { label: "Invite a colleague", href: "/portal/staff", icon: "UserPlus" },
        ].filter(Boolean) as { label: string; href: string; icon: string }[]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityFeed
          className="lg:col-span-2"
          items={recentActivity.map((row) => ({
            id: row.id,
            action: row.action,
            description: row.description,
            actor: row.userEmail,
            createdAt: row.createdAt.toISOString(),
          }))}
        />

        <div className="space-y-6">
          <Card title="Your access" description="Roles assigned to your account">
            <ul className="space-y-3">
              {user.roles.length === 0 && (
                <li className="text-sm text-gray-500">No role assigned — contact your administrator.</li>
              )}
              {user.roles.map((role) => (
                <li
                  key={role.id}
                  className="rounded-lg border border-gray-100 bg-gradient-to-r from-primary/5 to-transparent px-3 py-2"
                >
                  <p className="text-sm font-semibold text-dark">{role.name}</p>
                  <p className="text-xs text-gray-500">
                    <code>{role.key}</code> · level {role.level}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Your modules" description="Filtered by permission">
            <div className="portal-stagger grid gap-2">
              {modules.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="portal-card-hover flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary"
                >
                  {item.label}
                  <span aria-hidden className="text-gray-300">
                    →
                  </span>
                </Link>
              ))}
              {modules.length === 0 && (
                <p className="text-sm text-gray-500">No additional modules are available to your role.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
