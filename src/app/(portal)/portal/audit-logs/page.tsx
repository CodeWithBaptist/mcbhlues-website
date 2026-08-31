import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, EmptyState, PageHeader } from "@/components/portal/ui";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const access = await pageAccess("audit:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Sensitive administrative actions: who did what, to which resource, and when."
      />
      <Card>
        {logs.length === 0 ? (
          <EmptyState title="No audit entries yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Resource</th>
                  <th className="px-3 py-2">Metadata</th>
                  <th className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">{log.userEmail}</td>
                    <td className="px-3 py-2">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{log.action}</code>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {log.resource}
                      {log.resourceId && (
                        <span className="block text-[10px] text-gray-400">{log.resourceId}</span>
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-gray-500">
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
                      </pre>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-400">{log.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
