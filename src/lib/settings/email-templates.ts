import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { emailTemplates } from "@/db/schema";

/**
 * Email templates editable under Portal → System Settings. The default
 * subject/body ship in code so the feature works before anything is saved;
 * saving a template persists an override keyed by `key`.
 */
export const EMAIL_TEMPLATE_DEFAULTS = [
  {
    key: "staff_invite",
    name: "Staff invitation",
    description: "Sent when an administrator invites a new staff member.",
    subject: "You're invited to the MCBHLUES Staff Portal",
    body: "Hello {{firstName}},\n\nYou have been invited to join the MCBHLUES Staff Portal.\n\nAccept your invitation: {{inviteUrl}}\n\nThis link expires in {{expiresInHours}} hours.",
  },
  {
    key: "password_reset",
    name: "Password reset",
    description: "Sent when an administrator resets a staff password.",
    subject: "Your MCBHLUES Staff Portal password was reset",
    body: "Hello {{firstName}},\n\nYour password has been reset by an administrator.\n\nNew temporary password: {{temporaryPassword}}\n\nSign in and change it immediately.",
  },
  {
    key: "enquiry_auto_reply",
    name: "Enquiry auto-reply",
    description: "Acknowledgement sent to website visitors after they enquire.",
    subject: "We received your enquiry ({{reference}})",
    body: "Hello {{name}},\n\nThank you for contacting MCBHLUES ENTERPRISES. Your enquiry {{reference}} has been received and a consultant will respond shortly.",
  },
] as const;

export interface EmailTemplateView {
  key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  updatedAt: string | null;
}

export async function listEmailTemplates(): Promise<EmailTemplateView[]> {
  const db = await getDb();
  const rows = await db.select().from(emailTemplates);
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return EMAIL_TEMPLATE_DEFAULTS.map((template) => {
    const saved = byKey.get(template.key);
    return {
      key: template.key,
      name: template.name,
      description: template.description,
      subject: saved?.subject ?? template.subject,
      body: saved?.body ?? template.body,
      updatedAt: saved?.updatedAt ? saved.updatedAt.toISOString() : null,
    };
  });
}

export async function saveEmailTemplate(
  key: string,
  input: { subject: string; body: string },
  actorId: string
): Promise<EmailTemplateView | null> {
  const base = EMAIL_TEMPLATE_DEFAULTS.find((template) => template.key === key);
  if (!base) return null;
  const db = await getDb();
  const [existing] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1);
  if (existing) {
    await db
      .update(emailTemplates)
      .set({ subject: input.subject, body: input.body, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(emailTemplates.key, key));
  } else {
    await db.insert(emailTemplates).values({
      key,
      name: base.name,
      subject: input.subject,
      body: input.body,
      updatedBy: actorId,
    });
  }
  return {
    key,
    name: base.name,
    description: base.description,
    subject: input.subject,
    body: input.body,
    updatedAt: new Date().toISOString(),
  };
}

/** Renders a template with {{placeholder}} substitution. */
export function renderTemplate(template: { subject: string; body: string }, values: Record<string, string>) {
  const render = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? "");
  return { subject: render(template.subject), body: render(template.body) };
}
