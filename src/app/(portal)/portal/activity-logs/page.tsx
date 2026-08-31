import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, EmptyState, PageHeader } from "@/components/portal/ui";

export const dynamic = "force-dynamic";

export default async function ActivityLogsPage() {
  const access = await pageAccess("activity:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(200);

  return (
    <div>
      <PageHeader title="Activity Logs" description="Day-to-day staff activity across the portal." />
      <Card>
        {logs.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <ul className="divide-y divide-gray-50">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="w-40 shrink-0 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{log.action}</code>
                <span className="text-gray-700">{log.userEmail}</span>
                <span className="text-gray-500">{log.description}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
