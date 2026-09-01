import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createAnnouncement, listAnnouncements } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/cms/announcements */
export const GET = withPermission(["cms:announcements", "cms:read"], async () => {
  const list = await listAnnouncements();
  return NextResponse.json({ announcements: list });
});

/** POST /api/portal/cms/announcements — Requires cms:announcements. */
export const POST = withPermission("cms:announcements", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const announcement = await createAnnouncement(
    {
      title,
      body: typeof body?.body === "string" ? body.body : "",
      tone: typeof body?.tone === "string" ? body.tone : "info",
      isActive: body?.isActive !== false,
      startsAt: typeof body?.startsAt === "string" && body.startsAt ? body.startsAt : null,
      endsAt: typeof body?.endsAt === "string" && body.endsAt ? body.endsAt : null,
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_ANNOUNCEMENT_CREATED,
    resource: "announcement",
    resourceId: announcement.id,
    metadata: { title: announcement.title, tone: announcement.tone },
  });

  return NextResponse.json({ announcement }, { status: 201 });
});
