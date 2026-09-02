import { and, count, gt, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, sessions, settings, uploads, users } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { listEmailTemplates } from "@/lib/settings/email-templates";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader, PermissionChecklist } from "@/components/portal/ui";
import { SettingsForm } from "@/components/portal/settings-form";
import { EmailTemplatesManager } from "@/components/portal/email-templates-manager";
import { SystemHealth } from "@/components/portal/system-health";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const access = await pageAccess(["settings:system", "settings:security", "settings:email_templates"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canSystem = user.permissions.includes("settings:system");
  const canSecurity = user.permissions.includes("settings:security");
  const canTemplates = user.permissions.includes("settings:email_templates");

  const db = await getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.scope, ["system", "security"]));

  const saved: Record<string, string> = {};
  for (const row of rows) saved[row.key] = row.value == null ? "" : String(row.value);

  const systemInitial: Record<string, string> = {
    "system.session_hours": "12",
    "system.invite_ttl_hours": "72",
    "system.password_min_length": "10",
    "system.default_currency": "NGN",
    "system.timezone": "Africa/Lagos",
    "system.date_format": "dd/mm/yyyy",
    "system.maintenance_mode": "false",
    "system.maintenance_message": "",
    ...saved,
  };

  const securityInitial: Record<string, string> = {
    "security.max_failed_logins": "5",
    "security.lockout_minutes": "15",
    "security.invite_single_use": "true",
    ...saved,
  };

  const templates = canTemplates ? await listEmailTemplates() : [];

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

  const storageMb = Number(uploadStats?.bytes ?? 0) / (1024 * 1024);

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

      {canTemplates && <EmailTemplatesManager templates={templates} />}

      <Card
        title="Sensitive configuration"
        description="Each area is guarded by its own permission — the checklist reflects your effective access."
      >
        <PermissionChecklist
          granted={user.permissions}
          entries={[
            { key: "settings:system", label: "Manage system settings" },
            { key: "settings:email_templates", label: "Manage email templates" },
            { key: "settings:security", label: "Manage authentication & security" },
            { key: "notification:manage", label: "Manage notifications" },
            { key: "log:read", label: "View system logs" },
          ]}
        />
      </Card>
    </div>
  );
}
