import Link from "next/link";
import { and, count, gt, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, emailOutbox, notifications, sessions, settings, uploads, users } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { listEmailTemplates } from "@/lib/settings/email-templates";
import { getSecurityPolicy } from "@/lib/settings/system-config";
import { getEmailConfig, isEmailConfigured, listOutbox } from "@/lib/email/mailer";
import { maskIfSensitive } from "@/lib/settings/secrets";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader } from "@/components/portal/ui";
import { SettingsForm } from "@/components/portal/settings-form";
import { EmailTemplatesManager } from "@/components/portal/email-templates-manager";
import { SystemHealth } from "@/components/portal/system-health";
import { TestEmailButton } from "@/components/portal/email-delivery-status";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";
import { CheckCircle2, CircleAlert, ExternalLink, ShieldCheck, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const access = await pageAccess(["settings:system", "settings:security", "settings:email_templates"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canSystem = user.permissions.includes("settings:system");
  const canSecurity = user.permissions.includes("settings:security");
  const canTemplates = user.permissions.includes("settings:email_templates");
  const canLogs = user.permissions.includes("log:read");
  const canNotifications = user.permissions.includes("notification:manage");

  const db = await getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.scope, ["system", "security"]));

  const saved: Record<string, string> = {};
  for (const row of rows) {
    // Secrets (SMTP password, API keys) come back masked — the real value
    // never reaches the browser.
    saved[row.key] = maskIfSensitive(row.key, row.value == null ? "" : String(row.value));
  }

  const systemInitial: Record<string, string> = {
    "system.session_hours": "12",
    "system.invite_ttl_hours": "72",
    "system.password_min_length": "10",
    "system.default_currency": "NGN",
    "system.timezone": "Africa/Lagos",
    "system.date_format": "dd/mm/yyyy",
    "system.maintenance_mode": "false",
    "system.maintenance_message": "",
    "system.smtp_host": "",
    "system.smtp_port": "587",
    "system.smtp_secure": "false",
    "system.smtp_user": "",
    "system.smtp_pass": "",
    "system.email_from": "",
    "system.email_from_name": "MCBHLUES ENTERPRISES",
    ...saved,
  };

  const securityInitial: Record<string, string> = {
    "security.max_failed_logins": "5",
    "security.lockout_minutes": "15",
    "security.invite_single_use": "true",
    ...saved,
  };

  const [templates, emailConfig, outbox, securityPolicy] = await Promise.all([
    canTemplates ? listEmailTemplates() : Promise.resolve([]),
    getEmailConfig(),
    listOutbox(5),
    getSecurityPolicy(),
  ]);
  const emailReady = isEmailConfigured(emailConfig);

  // Outbox totals for the live status rows.
  const [totals] = await db
    .select({
      sent: sql<number>`count(*) filter (where ${emailOutbox.status} = 'sent')`,
      queued: sql<number>`count(*) filter (where ${emailOutbox.status} = 'queued')`,
      failed: sql<number>`count(*) filter (where ${emailOutbox.status} = 'failed')`,
    })
    .from(emailOutbox);
  const safeTotals = { sent: Number(totals?.sent ?? 0), queued: Number(totals?.queued ?? 0), failed: Number(totals?.failed ?? 0) };

  // Live system snapshot — the "is anything actually wired up?" panel.
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [staffTotal] = await db.select({ value: count() }).from(users);
  const [activeSessions] = await db
    .select({ value: count() })
    .from(sessions)
    .where(and(gt(sessions.expiresAt, now), isNull(sessions.revokedAt)));
  const [auditToday] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(gt(auditLogs.createdAt, dayAgo));
  const [uploadStats] = await db
    .select({ files: count(), bytes: sql<number>`coalesce(sum(${uploads.byteSize}), 0)` })
    .from(uploads);
  const [notificationTotal] = await db.select({ value: count() }).from(notifications);

  const storageMb = Number(uploadStats?.bytes ?? 0) / (1024 * 1024);
  const maintenanceOn = systemInitial["system.maintenance_mode"] === "true";

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        description="Restricted configuration. Every change is written to the audit log and takes effect immediately."
      />

      <SystemHealth
        stats={[
          { label: "Staff accounts", value: String(staffTotal?.value ?? 0) },
          { label: "Active sessions", value: String(activeSessions?.value ?? 0) },
          { label: "Audit events (24h)", value: String(auditToday?.value ?? 0) },
          {
            label: "Uploaded files",
            value: `${uploadStats?.files ?? 0} · ${storageMb.toFixed(1)} MB`,
          },
        ]}
      />

      {canSystem ? (
        <SettingsForm
          scope="system"
          requiredPermission="settings:system"
          title="Core configuration"
          description="Sessions, invitations and password policy. Requires settings:system."
          initial={systemInitial}
          fields={[
            {
              key: "system.session_hours",
              label: "Session lifetime (hours)",
              type: "number",
              min: 1,
              help: "Staff are signed out automatically after this period.",
            },
            {
              key: "system.invite_ttl_hours",
              label: "Invitation validity (hours)",
              type: "number",
              min: 1,
              help: "Invite links stop working once this window passes.",
            },
            {
              key: "system.password_min_length",
              label: "Minimum password length",
              type: "number",
              min: 8,
              max: 64,
              help: "Enforced on invitations and every password change. Minimum 8.",
            },
            {
              key: "system.default_currency",
              label: "Default currency",
              type: "select",
              options: SUPPORTED_CURRENCIES.map((option) => ({
                value: option.code,
                label: option.label,
              })),
              help: "Pre-selected when a new listing is created.",
            },
            {
              key: "system.timezone",
              label: "Timezone",
              type: "select",
              options: [
                { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
                { value: "Africa/Accra", label: "Africa/Accra (GMT)" },
                { value: "Europe/London", label: "Europe/London" },
                { value: "America/New_York", label: "America/New York" },
                { value: "Asia/Dubai", label: "Asia/Dubai" },
                { value: "UTC", label: "UTC" },
              ],
              help: "Used when timestamps are rendered for staff.",
            },
            {
              key: "system.date_format",
              label: "Date format",
              type: "select",
              options: [
                { value: "dd/mm/yyyy", label: "31/12/2026 (day first)" },
                { value: "mm/dd/yyyy", label: "12/31/2026 (month first)" },
                { value: "yyyy-mm-dd", label: "2026-12-31 (ISO)" },
              ],
            },
            {
              key: "system.google_maps_api_key",
              label: "Google Maps API key",
              placeholder: "AIza…",
              help: "Powers the map on public property pages.",
            },
            {
              key: "system.maintenance_mode",
              label: "Maintenance mode",
              type: "toggle",
              help: "Shows a maintenance notice to staff across the portal.",
            },
            {
              key: "system.maintenance_message",
              label: "Maintenance notice",
              type: "textarea",
              wide: true,
              placeholder: "Back at 6pm — we are migrating the listings database.",
            },
          ]}
        />
      ) : (
        <Card title="System settings">
          <p className="text-sm text-gray-500">
            Your role does not include <code>settings:system</code>, so the core configuration is read-only to you.
          </p>
        </Card>
      )}

      {canSecurity && (
        <SettingsForm
          scope="security"
          requiredPermission="settings:security"
          title="Authentication & security"
          description="Login protection controls, enforced by the sign-in endpoint. Requires settings:security."
          initial={securityInitial}
          fields={[
            {
              key: "security.max_failed_logins",
              label: "Max failed logins before lockout",
              type: "number",
              min: 0,
              help: "0 disables lockout entirely.",
            },
            {
              key: "security.lockout_minutes",
              label: "Lockout duration (minutes)",
              type: "number",
              min: 1,
              help: "How long an address must wait after too many failures.",
            },
            {
              key: "security.invite_single_use",
              label: "Single-use invitations",
              type: "toggle",
              help: "An invite link is consumed the first time it is accepted.",
            },
          ]}
        />
      )}

      {canSystem && (
        <>
          <SettingsForm
            scope="system"
            requiredPermission="settings:system"
            title="Email delivery (SMTP)"
            description="Where outgoing mail is sent from — customer enquiry replies, auto-replies, staff invitations and password resets."
            initial={systemInitial}
            fields={[
              {
                key: "system.smtp_host",
                label: "SMTP server",
                placeholder: "smtp.gmail.com",
                help: "Gmail / Google Workspace: smtp.gmail.com",
              },
              {
                key: "system.smtp_port",
                label: "SMTP port",
                type: "number",
                min: 1,
                placeholder: "587",
                help: "587 (STARTTLS, recommended) or 465 (SSL).",
              },
              {
                key: "system.smtp_user",
                label: "SMTP username",
                placeholder: "you@yourdomain.com",
                help: "For Gmail this is your full email address.",
              },
              {
                key: "system.smtp_pass",
                label: "SMTP password (app password)",
                type: "password",
                help: "Gmail: create an App Password (Google Account → Security → 2-Step Verification → App passwords). Your normal Google password will not work.",
              },
              {
                key: "system.smtp_secure",
                label: "Use SSL (port 465)",
                type: "toggle",
                help: "Off = STARTTLS on port 587 (recommended). On = SSL on port 465.",
              },
              {
                key: "system.email_from",
                label: "From address",
                placeholder: "info@yourdomain.com",
                help: "Usually the same address as the username. Must be allowed by your mail provider.",
              },
              {
                key: "system.email_from_name",
                label: "From name",
                placeholder: "MCBHLUES ENTERPRISES",
                help: "The sender name customers see in their inbox.",
              },
            ]}
          />

          <Card
            title="Email delivery status"
            description={
              emailReady
                ? `Transport active: ${emailConfig.host}:${emailConfig.port} · from ${emailConfig.from || emailConfig.user}`
                : "No mail server configured yet — outgoing messages are kept in the outbox below but not delivered."
            }
            actions={<TestEmailButton />}
          >
            {!emailReady && (
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <strong className="font-semibold">Gmail / Google Workspace:</strong> server{" "}
                <code>smtp.gmail.com</code>, port <code>587</code>, your full email address as the username, and an{" "}
                <strong className="font-semibold">App Password</strong> as the password (Google Account → Security →
                2-Step Verification → App passwords). Then save and click “Send me a test email”.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recent outgoing mail
              </p>
              {outbox.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nothing sent yet. Replies to customer enquiries, auto-replies and staff invitations will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {outbox.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-medium ${
                          entry.status === "sent"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : entry.status === "queued"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="font-medium text-gray-700">{entry.toEmail}</span>
                      <span className="min-w-0 flex-1 truncate text-gray-500">{entry.subject}</span>
                      <span className="text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              {canLogs && (
                <p className="pt-1 text-xs">
                  <Link href="/portal/logs" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    Open System Logs <ExternalLink className="h-3 w-3" />
                  </Link>
                </p>
              )}
            </div>
          </Card>
        </>
      )}

      {canTemplates && <EmailTemplatesManager templates={templates} />}

      <Card
        title="Sensitive configuration"
        description="Live status of every guarded area — each is protected by its own permission, and the badge shows your effective access."
      >
        <ul className="space-y-3">
          <SensitiveRow
            title="Core configuration"
            permission="settings:system"
            granted={canSystem}
            status={`Sessions last ${systemInitial["system.session_hours"] || "12"}h · invitations valid ${systemInitial["system.invite_ttl_hours"] || "72"}h · minimum password ${systemInitial["system.password_min_length"] || "10"} characters${maintenanceOn ? " · maintenance mode ON" : ""}`}
          />
          <SensitiveRow
            title="Email delivery & templates"
            permission="settings:email_templates"
            granted={canTemplates || canSystem}
            status={
              emailReady
                ? `${templates.length || 4} templates · SMTP ${emailConfig.host}:${emailConfig.port} · ${safeTotals.sent} delivered, ${safeTotals.queued} queued, ${safeTotals.failed} failed`
                : `${templates.length || 4} templates · SMTP not configured — ${safeTotals.queued} message(s) waiting in the outbox`
            }
            href={canLogs ? "/portal/logs" : undefined}
            linkLabel={canLogs ? "View logs" : undefined}
          />
          <SensitiveRow
            title="Authentication & security"
            permission="settings:security"
            granted={canSecurity}
            status={
              securityPolicy.maxFailedLogins > 0
                ? `Lockout after ${securityPolicy.maxFailedLogins} failed logins for ${securityPolicy.lockoutMinutes} min · single-use invitations ${securityPolicy.inviteSingleUse ? "on" : "off"}`
                : "Login lockout is disabled · single-use invitations " +
                  (securityPolicy.inviteSingleUse ? "on" : "off")
            }
          />
          <SensitiveRow
            title="Notifications"
            permission="notification:manage"
            granted={canNotifications}
            status={`${notificationTotal?.value ?? 0} notification(s) on record`}
            href={canNotifications ? "/portal/notifications" : undefined}
            linkLabel={canNotifications ? "Manage" : undefined}
          />
          <SensitiveRow
            title="System logs"
            permission="log:read"
            granted={canLogs}
            status={
              canLogs
                ? "Outgoing mail delivery and failures are recorded here."
                : "Requires the log:read permission — grant it under Roles or individual permissions."
            }
            href={canLogs ? "/portal/logs" : undefined}
            linkLabel={canLogs ? "Open logs" : undefined}
          />
        </ul>
      </Card>
    </div>
  );
}

function SensitiveRow({
  title,
  permission,
  granted,
  status,
  href,
  linkLabel,
}: {
  title: string;
  permission: string;
  granted: boolean;
  status: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-dark">
          {granted ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <ShieldX className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          {title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{status}</p>
      </div>
      <div className="flex items-center gap-2">
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary"
          >
            {linkLabel ?? "Open"} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <code
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
            granted ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
          }`}
        >
          {granted ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
          {permission}
        </code>
      </div>
    </li>
  );
}
