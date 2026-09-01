import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createTestimonial, listTestimonials } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/cms/testimonials */
export const GET = withPermission(["cms:testimonials", "cms:read"], async () => {
  const list = await listTestimonials();
  return NextResponse.json({ testimonials: list });
});

/** POST /api/portal/cms/testimonials — Requires cms:testimonials. */
export const POST = withPermission("cms:testimonials", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const quote = typeof body?.quote === "string" ? body.quote.trim() : "";
  if (!name || !quote) {
    return NextResponse.json({ error: "Name and quote are required." }, { status: 400 });
  }

  const testimonial = await createTestimonial(
    {
      name,
      quote,
      role: typeof body?.role === "string" ? body.role : "",
      avatarUrl: typeof body?.avatarUrl === "string" ? body.avatarUrl : "",
      rating: Number.isFinite(Number(body?.rating)) ? Number(body.rating) : 5,
      isPublished: body?.isPublished !== false,
      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_TESTIMONIAL_CREATED,
    resource: "testimonial",
    resourceId: testimonial.id,
    metadata: { name: testimonial.name },
  });

  return NextResponse.json({ testimonial }, { status: 201 });
});
