import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { listEmailTemplates, saveEmailTemplate } from "@/lib/settings/email-templates";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/email-templates — Requires settings:email_templates. */
export const GET = withPermission("settings:email_templates", async () => {
  const templates = await listEmailTemplates();
  return NextResponse.json({ templates });
});

/** PUT /api/portal/email-templates { key, subject, body } */
export const PUT = withPermission("settings:email_templates", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const subject = typeof body?.subject === "string" ? body.subject : "";
  const templateBody = typeof body?.body === "string" ? body.body : "";

  const saved = await saveEmailTemplate(key, { subject, body: templateBody }, user.id);
  if (!saved) return NextResponse.json({ error: "Unknown template." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.EMAIL_TEMPLATE_UPDATED,
    resource: "email_template",
    resourceId: key,
  });

  return NextResponse.json({ template: saved });
});
