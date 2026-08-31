import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader, PermissionChecklist } from "@/components/portal/ui";
import { SettingsForm } from "@/components/portal/settings-form";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const access = await pageAccess("settings:system");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const rows = await db.select().from(settings).where(eq(settings.scope, "system"));
  const initial: Record<string, string> = {
    "system.session_hours": "12",
    "system.invite_ttl_hours": "72",
    "system.password_min_length": "10",
  };
  for (const row of rows) initial[row.key] = String(row.value ?? "");

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        description="Restricted configuration. Only roles holding settings:system can reach this page."
      />
      <SettingsForm
        scope="system"
        requiredPermission="settings:system"
        initial={initial}
        fields={[
          { key: "system.session_hours", label: "Session lifetime (hours)" },
          { key: "system.invite_ttl_hours", label: "Invitation validity (hours)" },
          { key: "system.password_min_length", label: "Minimum password length" },
          { key: "system.google_maps_api_key", label: "Google Maps API key" },
        ]}
      />
      <Card
        title="Sensitive configuration"
        description="Each of these areas is guarded by its own permission."
      >
        <PermissionChecklist
          granted={access.user.permissions}
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
