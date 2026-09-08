import Link from "next/link";
import { pageAccess } from "@/lib/rbac/page-guard";
import { getEmailConfig, isEmailConfigured } from "@/lib/email/mailer";
import {
  listSubscribers,
  summariseSubscribers,
} from "@/lib/subscribers/subscriber-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { SubscribersManager } from "@/components/portal/subscribers-manager";

export const dynamic = "force-dynamic";

/**
 * Portal → Content → Newsletter.
 *
 * Reads straight from the `subscribers` table the public sign-up writes to, so
 * an address that joined a second ago is on this screen on the next refresh.
 * The welcome auto-reply each address receives is tracked in the same request
 * cycle — see `/api/public/subscribe`.
 */
export default async function SubscribersPage() {
  const access = await pageAccess("subscriber:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const [subscribers, emailConfig] = await Promise.all([
    listSubscribers(),
    // Best-effort: the list matters more than the banner underneath it.
    getEmailConfig().catch(() => null),
  ]);
  const summary = summariseSubscribers(subscribers);
  const canManage = access.user.permissions.includes("subscriber:update");
  const deliveryConfigured = emailConfig ? isEmailConfigured(emailConfig) : true;

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="Every address that joined the mailing list from the website. New subscribers are emailed the welcome template the moment they sign up."
        actions={
          <span className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600">
            {summary.active} active of {summary.total}
          </span>
        }
      />

      {!deliveryConfigured && (
        <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Subscribers are being stored, but the welcome auto-reply is{" "}
          <strong className="font-semibold">not being delivered</strong> — no SMTP
          transport is configured, so each message is parked in the outbox instead.
          Add credentials under{" "}
          <Link href="/portal/settings/system" className="font-semibold underline">
            System Settings → Email delivery
          </Link>{" "}
          and see{" "}
          <Link href="/portal/logs" className="font-semibold underline">
            System Logs
          </Link>{" "}
          for the queue.
        </p>
      )}

      {!canManage && (
        <p className="mb-5 text-sm text-gray-500">
          You can view the list but not change it — unsubscribing needs the{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">subscriber:update</code>{" "}
          permission.
        </p>
      )}

      <SubscribersManager
        initialSubscribers={subscribers}
        permissions={access.user.permissions}
        generatedAt={new Date().toISOString()}
      />
    </div>
  );
}
