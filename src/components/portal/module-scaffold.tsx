import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader, PermissionChecklist } from "@/components/portal/ui";

/**
 * Shared scaffold for the operational modules. The page is gated server-side
 * by `required`, and then renders exactly which actions the signed-in user may
 * perform inside the module, derived from their effective permissions.
 */
export async function ModuleScaffold({
  title,
  description,
  required,
  capabilities,
  children,
}: {
  title: string;
  description: string;
  required: string[];
  capabilities: { key: string; label: string }[];
  children?: React.ReactNode;
}) {
  const access = await pageAccess(required);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      {children}
      <Card
        title="Your capabilities in this module"
        description="Enforced on the server for every action and API route — greyed-out entries return 403."
      >
        <PermissionChecklist granted={access.user.permissions} entries={capabilities} />
      </Card>
    </div>
  );
}
