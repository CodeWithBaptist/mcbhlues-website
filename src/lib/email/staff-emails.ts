import { sendEmail, type SendEmailResult } from "@/lib/email/mailer";
import { getCompanyInfo } from "@/lib/settings/company";
import { getEmailTemplate, renderTemplate } from "@/lib/settings/email-templates";

interface StaffEmailInput {
  firstName: string;
  email: string;
  /** Absolute invitation URL, e.g. https://portal.example.com/portalinvite/<token> */
  inviteUrl: string;
  expiresInHours: number;
}

/** Emails a secure portal invitation using the "Staff invitation" template. */
export async function sendStaffInviteEmail(input: StaffEmailInput): Promise<SendEmailResult> {
  const template = await getEmailTemplate("staff_invite");
  if (!template) return { status: "failed", error: "Missing staff_invite template." };

  const company = await getCompanyInfo();
  const rendered = renderTemplate(template, {
    firstName: input.firstName,
    inviteUrl: input.inviteUrl,
    expiresInHours: String(input.expiresInHours),
    companyName: company.name,
  });

  return sendEmail({
    to: input.email,
    subject: rendered.subject,
    text: rendered.body,
    purpose: "staff_invite",
  });
}

/** Emails the "set a new password" link after an admin reset. */
export async function sendPasswordResetEmail(input: StaffEmailInput): Promise<SendEmailResult> {
  const template = await getEmailTemplate("password_reset");
  if (!template) return { status: "failed", error: "Missing password_reset template." };

  const company = await getCompanyInfo();
  const rendered = renderTemplate(template, {
    firstName: input.firstName,
    inviteUrl: input.inviteUrl,
    expiresInHours: String(input.expiresInHours),
    companyName: company.name,
  });

  return sendEmail({
    to: input.email,
    subject: rendered.subject,
    text: rendered.body,
    purpose: "password_reset",
  });
}

/** Whole hours until expiry, for the {{expiresInHours}} placeholder. */
export function hoursUntil(expiresAt: Date): number {
  return Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 3_600_000));
}
