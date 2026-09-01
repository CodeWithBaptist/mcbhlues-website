import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** PATCH /api/portal/cms/announcements/:id — Requires cms:announcements. */
export const PATCH = withPermission("cms:announcements", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const announcement = await updateAnnouncement(id, {
    title: typeof body?.title === "string" ? body.title : undefined,
    body: typeof body?.body === "string" ? body.body : undefined,
    tone: typeof body?.tone === "string" ? body.tone : undefined,
    isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
    startsAt: body?.startsAt === null ? null : typeof body?.startsAt === "string" ? body.startsAt || null : undefined,
    endsAt: body?.endsAt === null ? null : typeof body?.endsAt === "string" ? body.endsAt || null : undefined,
  });

  if (!announcement) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_ANNOUNCEMENT_UPDATED,
    resource: "announcement",
    resourceId: id,
    metadata: { title: announcement.title, isActive: announcement.isActive },
  });

  return NextResponse.json({ announcement });
});

/** DELETE /api/portal/cms/announcements/:id — Requires cms:announcements. */
export const DELETE = withPermission("cms:announcements", async (_request, { params, user }) => {
  const { id } = await params;
  const deleted = await deleteAnnouncement(id);
  if (!deleted) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_ANNOUNCEMENT_DELETED,
    resource: "announcement",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
});
