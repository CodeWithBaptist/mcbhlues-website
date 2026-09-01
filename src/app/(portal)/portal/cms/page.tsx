import { pageAccess } from "@/lib/rbac/page-guard";
import { getCmsBlocks } from "@/lib/cms/cms-service";
import { listPropertiesForCuration } from "@/lib/properties/property-service";
import { hasPermission } from "@/lib/rbac/can";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { CmsManager } from "@/components/portal/cms-manager";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const access = await pageAccess("cms:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canFeatured = hasPermission(user.permissions, "cms:featured_properties");

  const [blocks, properties] = await Promise.all([
    getCmsBlocks(),
    // Featured-property management needs the listing; other blocks do not.
    canFeatured ? listPropertiesForCuration() : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Website CMS"
        description="Edit the copy shown on the public website and curate which listings are featured on the homepage."
      />
      <CmsManager blocks={blocks} properties={properties} permissions={user.permissions} />
    </div>
  );
}
