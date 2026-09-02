import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { SettingsForm } from "@/components/portal/settings-form";
import { LogoSettings } from "@/components/portal/logo-settings";
import { SITE_CONFIG } from "@/constants";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const access = await pageAccess("settings:company");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const db = await getDb();
  const rows = await db.select().from(settings).where(eq(settings.scope, "company"));
  const initial: Record<string, string> = {
    "company.name": SITE_CONFIG.name,
    "company.email": SITE_CONFIG.contact.email,
    "company.phone": SITE_CONFIG.contact.phone,
    "company.address": SITE_CONFIG.contact.address,
  };
  for (const row of rows) initial[row.key] = String(row.value ?? "");

  return (
    <div>
      <PageHeader
        title="Company Settings"
        description="Business details shown across the public website and staff communications."
      />
      <div className="mb-6">
        <LogoSettings initialLogoUrl={initial["company.logo"] ?? ""} />
      </div>
      <SettingsForm
        scope="company"
        requiredPermission="settings:company"
        initial={initial}
        fields={[
          { key: "company.name", label: "Company name" },
          { key: "company.email", label: "Contact email" },
          { key: "company.phone", label: "Contact phone" },
          { key: "company.address", label: "Office address" },
          { key: "company.facebook", label: "Facebook URL" },
          { key: "company.instagram", label: "Instagram URL" },
          { key: "company.twitter", label: "Twitter / X URL" },
          { key: "company.linkedin", label: "LinkedIn URL" },
        ]}
      />
    </div>
  );
}
