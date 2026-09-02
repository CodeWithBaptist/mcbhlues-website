import { sendEmail, type SendEmailResult } from "@/lib/email/mailer";
import { getCompanyInfo } from "@/lib/settings/company";
import { getEmailTemplate, renderTemplate } from "@/lib/settings/email-templates";
import type { EnquiryListItem } from "@/lib/enquiries/enquiry-service";
import type { AuthenticatedUser } from "@/lib/auth/session";

/**
 * Emails the customer their consultant's reply. The message body is recorded
 * on the enquiry thread separately — this only handles delivery.
 */
export async function sendEnquiryResponseEmail(
  enquiry: EnquiryListItem,
  message: string,
  actor: Pick<AuthenticatedUser, "firstName" | "lastName" | "email">
): Promise<SendEmailResult> {
  const template = await getEmailTemplate("enquiry_response");
  if (!template || !enquiry.email) {
    return { status: "queued", error: "No customer email address on record." };
  }

  const company = await getCompanyInfo();
  const staffName = `${actor.firstName} ${actor.lastName}`.trim() || actor.email;

  const rendered = renderTemplate(template, {
    name: enquiry.name,
    reference: enquiry.reference,
    subject: enquiry.subject || enquiryPropertySubject(enquiry),
    message,
    staffName,
    staffEmail: actor.email,
    companyName: company.name,
    companyEmail: company.email,
    companyPhone: company.phone,
    propertyTitle: enquiry.propertyTitle ?? "",
  });

  return sendEmail({
    to: enquiry.email,
    subject: rendered.subject,
    text: rendered.body,
    purpose: "enquiry_response",
  });
}

/** Instant acknowledgement fired the moment a website enquiry arrives. */
export async function sendEnquiryAutoReply(enquiry: EnquiryListItem): Promise<SendEmailResult | null> {
  if (!enquiry.email) return null;
  const template = await getEmailTemplate("enquiry_auto_reply");
  if (!template) return null;

  const company = await getCompanyInfo();
  const rendered = renderTemplate(template, {
    name: enquiry.name,
    reference: enquiry.reference,
    companyName: company.name,
    companyPhone: company.phone,
    companyEmail: company.email,
  });

  return sendEmail({
    to: enquiry.email,
    subject: rendered.subject,
    text: rendered.body,
    purpose: "enquiry_auto_reply",
  });
}

function enquiryPropertySubject(enquiry: EnquiryListItem): string {
  if (enquiry.propertyTitle) return `Enquiry about ${enquiry.propertyTitle}`;
  return `Your ${enquiry.type} enquiry`;
}
