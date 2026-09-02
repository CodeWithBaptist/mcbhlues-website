import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { isEmailConfigured, getEmailConfig } from "@/lib/email/mailer";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, EmptyState, PageHeader } from "@/components/portal/ui";

export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<string, string> = {
  enquiry_response: "Enquiry reply",
  enquiry_auto_reply: "Enquiry auto-reply",
  staff_invite: "Staff invitation",
  password_reset: "Password reset",
  email_test: "Test email",
  general: "General",
};

export default async function SystemLogsPage() {
  const access = await pageAccess("log:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const entries = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(200);
  const config = await getEmailConfig();
  const configured = isEmailConfigured(config);

  const sent = entries.filter((entry) => entry.status === "sent").length;
  const queued = entries.filter((entry) => entry.status === "queued").length;
  const failed = entries.filter((entry) => entry.status === "failed").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Logs"
        description="Every email the portal has attempted to send — delivered, queued, or rejected."
      />

      {!configured && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Email delivery is <strong className="font-semibold">not configured</strong>. Messages below are
          stored but not sent. Add SMTP credentials under{" "}
          <Link href="/portal/settings/system" className="font-semibold underline">
            System Settings → Email delivery
          </Link>
          .
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <LogStat label="Total attempts" value={entries.length} tone="text-dark" />
        <LogStat label="Delivered" value={sent} tone="text-green-600" />
        <LogStat label="Queued (unsent)" value={queued} tone="text-amber-600" />
        <LogStat label="Failed" value={failed} tone="text-red-600" />
      </div>

      <Card>
        {entries.length === 0 ? (
          <EmptyState
            title="No email activity yet"
            description="Reply to a customer enquiry or send a test email from System Settings and it will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">To</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                          entry.status === "sent"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : entry.status === "queued"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-xs text-gray-700">{entry.toEmail}</td>
                    <td className="max-w-[260px] px-3 py-2 text-xs text-gray-600">
                      <span className="line-clamp-2">{entry.subject || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                      {PURPOSE_LABELS[entry.purpose] ?? entry.purpose}
                    </td>
                    <td className="max-w-[280px] px-3 py-2 text-[11px] text-gray-400">
                      {entry.error ? (
                        <span className="text-red-500">{entry.error}</span>
                      ) : entry.sentAt ? (
                        `Delivered ${new Date(entry.sentAt).toLocaleString()}`
                      ) : (
                        "—"
                      )}
                    </td>
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

function LogStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
