import Link from "next/link";
import { pageAccess } from "@/lib/rbac/page-guard";
import { buildReport, type NamedCount } from "@/lib/reports/report-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs capitalize text-gray-500">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-dark">{value}</span>
    </div>
  );
}

function Breakdown({ title, description, rows }: { title: string; description: string; rows: NamedCount[] }) {
  const max = rows.reduce((largest, row) => Math.max(largest, row.value), 0);
  return (
    <Card title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <BarRow key={row.label} label={row.label} value={row.value} max={max} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function ReportsPage() {
  const access = await pageAccess("report:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const report = await buildReport();

  const canSeeActivity = user.permissions.includes("activity:read");
  const canSeeAudit = user.permissions.includes("audit:read");
  const canSeeLogs = user.permissions.includes("log:read");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Live operational snapshot across properties, customers, enquiries and bookings."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {report.totals.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown
          title="Properties by status"
          description="Pipeline health across the whole portfolio"
          rows={report.propertiesByStatus}
        />
        <Breakdown
          title="Listings by type"
          description="Sale vs rental inventory"
          rows={report.propertiesByType}
        />
        <Breakdown
          title="Enquiries by status"
          description="Response workload and resolution"
          rows={report.enquiriesByStatus}
        />
        <Breakdown
          title="Enquiries by type"
          description="General vs property-specific demand"
          rows={report.enquiriesByType}
        />
        <Breakdown
          title="Bookings by status"
          description="Confirmations, completions and cancellations"
          rows={report.bookingsByStatus}
        />
        <Breakdown
          title="Customers by type"
          description="Buyers, renters, investors and sellers"
          rows={report.customersByType}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming bookings" description="Next confirmed and pending appointments">
          {report.upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-gray-50 text-sm">
              {report.upcomingBookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium capitalize text-gray-700">
                      {booking.type} · {booking.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {booking.reference} · {new Date(booking.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                      booking.status === "confirmed"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    {booking.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canSeeActivity && (
          <Card title="Recent staff activity" description="Latest recorded actions across the portal">
            {report.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50 text-sm">
                {report.recentActivity.map((entry, index) => (
                  <li key={index} className="py-2">
                    <p className="text-gray-700">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{entry.action}</code>{" "}
                      <span className="text-xs text-gray-500">{entry.userEmail}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {entry.description || "—"} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <Card title="Log viewers" description="Each area is guarded by its own permission.">
        <div className="flex flex-wrap gap-2">
          {canSeeActivity && (
            <Link
              href="/portal/activity-logs"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              Activity logs →
            </Link>
          )}
          {canSeeAudit && (
            <Link
              href="/portal/audit-logs"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              Audit logs →
            </Link>
          )}
          {canSeeLogs && (
            <span className="rounded-lg border border-dashed border-gray-200 px-4 py-2 text-sm text-gray-400">
              System logs stream to the server console (log:read granted)
            </span>
          )}
          {!canSeeActivity && !canSeeAudit && !canSeeLogs && (
            <p className="text-sm text-gray-400">
              Your role has report:read only — ask an administrator for activity:read or audit:read to open the raw
              logs.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
