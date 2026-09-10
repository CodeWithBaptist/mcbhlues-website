import { and, asc, count, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import {
  activityLogs,
  auditLogs,
  bookings,
  enquiries,
  permissions,
  properties,
  propertyImages,
  roles,
  subscribers,
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
import { Reveal } from "@/components/portal/reveal";
import { EnquiriesTrendChart } from "@/components/portal/enquiries-trend-chart";
import { ListingsStatusDonut } from "@/components/portal/listings-status-donut";
import { LatestEnquiries } from "@/components/portal/latest-enquiries";
import { RecentListings } from "@/components/portal/recent-listings";
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
  const canSeeSubscribers = user.permissions.includes("subscriber:read");

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
  // Anyone holding subscriber:read sees the whole list, so a single query for
  // both numbers is cheaper than two round trips.
  const [subscriberCount] = canSeeSubscribers
    ? await db
        .select({
          value: count(),
          active: sql<number>`count(*) filter (where ${eq(subscribers.status, "active")})::int`,
        })
        .from(subscribers)
    : [{ value: 0, active: 0 }];

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
    canSeeSubscribers && {
      label: "Newsletter list",
      value: String(subscriberCount.value),
      hint: `${subscriberCount.active} subscribed`,
      icon: "Mails",
      tone: "sky" as const,
      href: "/portal/subscribers",
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

  /* ---------------------------------------------------------------------- */
  /*  Overview widgets: trend chart, status split, inbox & portfolio peeks   */
  /* ---------------------------------------------------------------------- */

  const now = new Date();
  // Enquiries are bucketed per UTC month so the chart lines up with the
  // month labels regardless of the server's local timezone.
  const trendWindowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const trendRows = canSeeEnquiries
    ? await db
        .select({
          key: sql<string>`to_char(date_trunc('month', ${enquiries.createdAt} at time zone 'UTC'), 'YYYY-MM')`,
          value: count(),
        })
        .from(enquiries)
        .where(gt(enquiries.createdAt, trendWindowStart))
        .groupBy(sql`date_trunc('month', ${enquiries.createdAt} at time zone 'UTC')`)
    : [];

  const countByMonth = new Map(trendRows.map((row) => [row.key, row.value]));
  const monthLabel = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
  const monthKey = (offset: number) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: monthLabel.format(date),
    };
  };
  // The chart shows the most recent six months; the six before form the
  // baseline for the header's delta badge.
  const trendPoints = Array.from({ length: 6 }, (_, index) => {
    const month = monthKey(5 - index);
    return { label: month.label, value: countByMonth.get(month.key) ?? 0 };
  });
  const currentPeriod = trendPoints.reduce((sum, point) => sum + point.value, 0);
  const previousPeriod = Array.from({ length: 6 }, (_, index) => countByMonth.get(monthKey(11 - index).key) ?? 0).reduce(
    (sum, value) => sum + value,
    0
  );
  const trendDelta =
    previousPeriod > 0
      ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
      : currentPeriod > 0
        ? 100
        : null;

  const statusRows = canSeeProperties
    ? await db.select({ status: properties.status, value: count() }).from(properties).groupBy(properties.status)
    : [];
  // Known statuses lead in a fixed order; anything custom trails alphabetically.
  const statusOrder = ["available", "pending", "rented", "sold"];
  const donutSegments = statusRows
    .map((row) => ({
      key: row.status,
      label: row.status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()),
      value: row.value,
    }))
    .sort((a, b) => {
      const rank = (key: string) => {
        const index = statusOrder.indexOf(key);
        return index === -1 ? statusOrder.length : index;
      };
      return rank(a.key) - rank(b.key) || a.label.localeCompare(b.label);
    });

  const latestEnquiries = canSeeEnquiries
    ? await db
        .select({
          id: enquiries.id,
          reference: enquiries.reference,
          subject: enquiries.subject,
          name: enquiries.name,
          type: enquiries.type,
          status: enquiries.status,
          createdAt: enquiries.createdAt,
          propertyName: properties.name,
        })
        .from(enquiries)
        .leftJoin(properties, eq(enquiries.propertyId, properties.id))
        .orderBy(desc(enquiries.createdAt))
        .limit(5)
    : [];

  const recentProperties = canSeeProperties
    ? await db
        .select({
          id: properties.id,
          name: properties.name,
          city: properties.city,
          state: properties.state,
          status: properties.status,
        })
        .from(properties)
        .orderBy(desc(properties.createdAt))
        .limit(5)
    : [];

  const listingIds = recentProperties.map((row) => row.id);
  const listingImageRows = canSeeProperties && listingIds.length > 0
    ? await db
        .select({
          propertyId: propertyImages.propertyId,
          url: propertyImages.url,
          alt: propertyImages.alt,
          isPrimary: propertyImages.isPrimary,
        })
        .from(propertyImages)
        .where(inArray(propertyImages.propertyId, listingIds))
        .orderBy(asc(propertyImages.sortOrder))
    : [];
  // The primary photo wins; otherwise the first photo by sort order fills in.
  const fallbackImage = new Map<string, { url: string; alt: string }>();
  const primaryImage = new Map<string, { url: string; alt: string }>();
  for (const image of listingImageRows) {
    if (!fallbackImage.has(image.propertyId)) fallbackImage.set(image.propertyId, { url: image.url, alt: image.alt });
    if (image.isPrimary && !primaryImage.has(image.propertyId))
      primaryImage.set(image.propertyId, { url: image.url, alt: image.alt });
  }

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

      <div className="portal-stagger grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
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

      <Reveal className="grid items-start gap-6 lg:grid-cols-3" delay={60}>
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
                  className="border-b border-gray-100 py-2 last:border-0"
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
                  className="portal-card-hover flex min-h-11 items-center justify-between border-b border-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:text-primary"
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
      </Reveal>

      {(canSeeEnquiries || canSeeProperties) && (
        <Reveal className="grid items-start gap-6 lg:grid-cols-3" delay={90}>
          {canSeeEnquiries && (
            <EnquiriesTrendChart
              className={canSeeProperties ? "lg:col-span-2" : "lg:col-span-3"}
              points={trendPoints}
              delta={trendDelta}
            />
          )}
          {canSeeProperties && (
            <ListingsStatusDonut className={canSeeEnquiries ? undefined : "lg:col-span-3"} segments={donutSegments} />
          )}
        </Reveal>
      )}

      {(canSeeEnquiries || canSeeProperties) && (
        <Reveal className="grid items-start gap-6 lg:grid-cols-3" delay={120}>
          {canSeeEnquiries && (
            <LatestEnquiries
              className={canSeeProperties ? "lg:col-span-2" : "lg:col-span-3"}
              items={latestEnquiries.map((row) => ({
                id: row.id,
                reference: row.reference,
                subject: row.subject || row.name,
                type: row.type,
                status: row.status,
                propertyName: row.propertyName,
                createdAt: row.createdAt.toISOString(),
              }))}
            />
          )}
          {canSeeProperties && (
            <RecentListings
              items={recentProperties.map((row) => {
                const image = primaryImage.get(row.id) ?? fallbackImage.get(row.id);
                return {
                  id: row.id,
                  name: row.name,
                  location: [row.city, row.state].filter(Boolean).join(", "),
                  status: row.status,
                  imageUrl: image?.url ?? null,
                  imageAlt: image?.alt || row.name,
                };
              })}
            />
          )}
        </Reveal>
      )}
    </div>
  );
}
