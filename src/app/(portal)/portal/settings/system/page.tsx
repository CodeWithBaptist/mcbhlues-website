import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { listEmailTemplates } from "@/lib/settings/email-templates";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader, PermissionChecklist } from "@/components/portal/ui";
import { SettingsForm } from "@/components/portal/settings-form";
import { EmailTemplatesManager } from "@/components/portal/email-templates-manager";

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
    ...saved,
  };

  const securityInitial: Record<string, string> = {
    "security.max_failed_logins": "0",
    "security.lockout_minutes": "15",
    "security.invite_single_use": "true",
    ...saved,
  };

  const templates = canTemplates ? await listEmailTemplates() : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        description="Restricted configuration. Every change is written to the audit log and takes effect immediately."
      />

      {canSystem ? (
        <SettingsForm
          scope="system"
          requiredPermission="settings:system"
          initial={systemInitial}
          fields={[
            {
              key: "system.session_hours",
              label: "Session lifetime (hours)",
              placeholder: "12 — staff are signed out after this period",
            },
            {
              key: "system.invite_ttl_hours",
              label: "Invitation validity (hours)",
              placeholder: "72 — invite links expire after this period",
            },
            {
              key: "system.password_min_length",
              label: "Minimum password length",
              placeholder: "10 — enforced on every password change",
            },
            {
              key: "system.google_maps_api_key",
              label: "Google Maps API key",
              placeholder: "Used by the public property maps",
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
          description="Login protection controls. Requires settings:security."
          initial={securityInitial}
          fields={[
            {
              key: "security.max_failed_logins",
              label: "Max failed logins before lockout",
              placeholder: "0 = disabled",
            },
            {
              key: "security.lockout_minutes",
              label: "Lockout duration (minutes)",
              placeholder: "15",
            },
            {
              key: "security.invite_single_use",
              label: "Single-use invitations",
              placeholder: "true | false",
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
