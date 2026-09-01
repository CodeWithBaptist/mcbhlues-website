import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteFaq, updateFaq } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** PATCH /api/portal/cms/faqs/:id — Requires cms:faqs. */
export const PATCH = withPermission("cms:faqs", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const faq = await updateFaq(id, {
    question: typeof body?.question === "string" ? body.question : undefined,
    answer: typeof body?.answer === "string" ? body.answer : undefined,
    category: typeof body?.category === "string" ? body.category : undefined,
    isPublished: typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,
  });

  if (!faq) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_FAQ_UPDATED,
    resource: "faq",
    resourceId: id,
    metadata: { isPublished: faq.isPublished },
  });

  return NextResponse.json({ faq });
});

/** DELETE /api/portal/cms/faqs/:id — Requires cms:faqs. */
export const DELETE = withPermission("cms:faqs", async (_request, { params, user }) => {
  const { id } = await params;
  const deleted = await deleteFaq(id);
  if (!deleted) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_FAQ_DELETED,
    resource: "faq",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
});
