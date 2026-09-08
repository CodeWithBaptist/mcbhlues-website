import { sendEmail, type SendEmailResult } from "@/lib/email/mailer";
import { getCompanyInfo } from "@/lib/settings/company";
import { getEmailTemplate, renderTemplate } from "@/lib/settings/email-templates";
import { SITE_CONFIG } from "@/constants";

/**
 * The auto-reply that goes to the address a visitor just typed into the
 * homepage sign-up.
 *
 * Deliberately *not* awaited-and-checked by the caller for success: a working
 * sign-up must never be undone by a mail server. `sendEmail` already records
 * every attempt in the outbox (Portal → System Logs), so a delivery problem is
 * visible and repairable rather than silently swallowed.
 *
 * Editing the wording is a portal task, not a deploy: the copy comes from the
 * "Newsletter welcome" template under System Settings → Email templates.
 */

/**
 * A friendly name for the greeting. Only an email address is collected, so the
 * local part is used when it reads like a person's name and otherwise the
 * greeting falls back to "there".
 */
export function greetingFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const candidate = local
    .replace(/[-._+]+/g, " ")
    .replace(/\d+/, "")
    .trim();
  if (!candidate) return "there";
  // "tunde.adeyemi" → "Tunde Adeyemi"; "s1234" → "there".
  const words = candidate
    .split(/\s+/)
    .filter((word) => /^[a-z\u00c0-\u024f]{2,}$/i.test(word));
  if (words.length === 0) return "there";
  return words
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export interface NewsletterWelcomeInput {
  /** The address exactly as it was stored — lower-cased and normalised. */
  email: string;
}

export async function sendNewsletterWelcomeEmail(
  input: NewsletterWelcomeInput
): Promise<SendEmailResult> {
  const template = await getEmailTemplate("newsletter_welcome");
  if (!template) {
    return { status: "failed", error: "Missing newsletter_welcome template." };
  }

  const company = await getCompanyInfo();
  const rendered = renderTemplate(template, {
    email: input.email,
    name: greetingFor(input.email),
    firstName: greetingFor(input.email),
    companyName: company.name,
    companyEmail: company.email,
    companyPhone: company.phone,
    companyAddress: company.address,
    listingsUrl: `${SITE_CONFIG.url}/properties`,
    siteUrl: SITE_CONFIG.url,
  });

  return sendEmail({
    to: input.email,
    subject: rendered.subject,
    text: rendered.body,
    purpose: "newsletter_welcome",
  });
}
