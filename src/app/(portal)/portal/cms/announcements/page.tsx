import { pageAccess } from "@/lib/rbac/page-guard";
import { listAnnouncements } from "@/lib/cms/cms-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { AnnouncementsManager } from "@/components/portal/announcements-manager";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const access = await pageAccess(["cms:announcements", "cms:read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const rows = await listAnnouncements();
  const announcements = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    tone: row.tone,
    isActive: row.isActive,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
  }));

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Site-wide banners — active announcements appear at the top of the public website."
      />
      <AnnouncementsManager
        initialAnnouncements={announcements}
        canManage={access.user.permissions.includes("cms:announcements")}
      />
    </div>
  );
}
