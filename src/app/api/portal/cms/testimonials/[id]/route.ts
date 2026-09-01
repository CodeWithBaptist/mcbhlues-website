import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteTestimonial, updateTestimonial } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** PATCH /api/portal/cms/testimonials/:id — Requires cms:testimonials. */
export const PATCH = withPermission("cms:testimonials", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const testimonial = await updateTestimonial(id, {
    name: typeof body?.name === "string" ? body.name : undefined,
    role: typeof body?.role === "string" ? body.role : undefined,
    quote: typeof body?.quote === "string" ? body.quote : undefined,
    avatarUrl: typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined,
    rating: Number.isFinite(Number(body?.rating)) ? Number(body.rating) : undefined,
    isPublished: typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,
  });

  if (!testimonial) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_TESTIMONIAL_UPDATED,
    resource: "testimonial",
    resourceId: id,
    metadata: { name: testimonial.name, isPublished: testimonial.isPublished },
  });

  return NextResponse.json({ testimonial });
});

/** DELETE /api/portal/cms/testimonials/:id — Requires cms:testimonials. */
export const DELETE = withPermission("cms:testimonials", async (_request, { params, user }) => {
  const { id } = await params;
  const deleted = await deleteTestimonial(id);
  if (!deleted) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_TESTIMONIAL_DELETED,
    resource: "testimonial",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
});
