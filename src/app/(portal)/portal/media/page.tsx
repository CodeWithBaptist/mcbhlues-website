import { pageAccess } from "@/lib/rbac/page-guard";
import { listMediaAssets } from "@/lib/media/media-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { MediaManager } from "@/components/portal/media-manager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const access = await pageAccess("media:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const rows = await listMediaAssets();
  const assets = rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    kind: row.kind,
    folder: row.folder,
    alt: row.alt,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Images, documents and brand assets — copy any URL straight into listings or CMS content."
      />
      <MediaManager initialAssets={assets} permissions={access.user.permissions} />
    </div>
  );
}
