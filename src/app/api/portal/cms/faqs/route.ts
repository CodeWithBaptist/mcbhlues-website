import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createFaq, listFaqs } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/cms/faqs */
export const GET = withPermission(["cms:faqs", "cms:read"], async () => {
  const list = await listFaqs();
  return NextResponse.json({ faqs: list });
});

/** POST /api/portal/cms/faqs — Requires cms:faqs. */
export const POST = withPermission("cms:faqs", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }

  const faq = await createFaq(
    {
      question,
      answer,
      category: typeof body?.category === "string" ? body.category : "general",
      isPublished: body?.isPublished !== false,
      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_FAQ_CREATED,
    resource: "faq",
    resourceId: faq.id,
    metadata: { question: faq.question.slice(0, 80) },
  });

  return NextResponse.json({ faq }, { status: 201 });
});
