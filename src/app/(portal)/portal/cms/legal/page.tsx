import { pageAccess } from "@/lib/rbac/page-guard";
import { getLegalDocs } from "@/lib/legal/legal-docs";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { LegalManager } from "@/components/portal/legal-manager";

export const dynamic = "force-dynamic";

export default async function LegalDocumentsPage() {
  const access = await pageAccess(["cms:legal", "cms:read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const docs = await getLegalDocs();

  return (
    <div>
      <PageHeader
        title="Legal Documents"
        description="Privacy Policy, Terms & Conditions and Cookie Policy as published on the public website."
      />
      <LegalManager
        initialDocs={docs}
        canManage={access.user.permissions.includes("cms:legal")}
      />
    </div>
  );
}
