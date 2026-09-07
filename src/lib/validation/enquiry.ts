/**
 * Shared validation for the public enquiry forms.
 *
 * Deliberately isomorphic: the exact same rules run in the browser (so the
 * visitor gets instant, field-level feedback) and again on the server (so a
 * crafted request can never bypass them). Never trust the client copy.
 */

export const FIELD_LIMITS = {
  name: 80,
  email: 254,
  phone: 32,
  subject: 120,
  message: 2000,
} as const;

/** Pragmatic, deliberately permissive address check (RFC 5322 is not worth it). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Digits, spaces and the usual separators; 7-20 digits total. */
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,25}$/;

export type EnquiryField = "name" | "email" | "phone" | "subject" | "message";

export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export interface EnquiryInput {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export interface ValidateOptions {
  /** Property-inquiry forms auto-fill a message, so it may be blank. */
  requireMessage?: boolean;
}

function collapse(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** Trim, collapse runs of whitespace and hard-truncate to the column limit. */
export function normaliseEnquiry(input: EnquiryInput) {
  return {
    name: collapse(input.name).slice(0, FIELD_LIMITS.name),
    email: collapse(input.email).toLowerCase().slice(0, FIELD_LIMITS.email),
    phone: collapse(input.phone).slice(0, FIELD_LIMITS.phone),
    subject: collapse(input.subject).slice(0, FIELD_LIMITS.subject),
    // Keep the visitor's line breaks in the message; only trim the ends.
    message:
      typeof input.message === "string"
        ? input.message.trim().slice(0, FIELD_LIMITS.message)
        : "",
  };
}

export function validateEnquiry(
  input: EnquiryInput,
  { requireMessage = true }: ValidateOptions = {}
): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const values = normaliseEnquiry(input);

  if (!values.name) {
    errors.name = "Please enter your name.";
  } else if (values.name.length < 2) {
    errors.name = "That name looks too short.";
  } else if (values.name.length > FIELD_LIMITS.name) {
    errors.name = `Please keep your name under ${FIELD_LIMITS.name} characters.`;
  } else if (/(https?:\/\/|www\.)/i.test(values.name)) {
    errors.name = "Please enter a name, not a link.";
  }

  if (!values.email) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "That email address doesn't look right.";
  }

  if (values.phone && !PHONE_PATTERN.test(values.phone)) {
    errors.phone = "Please enter a valid phone number, e.g. +234 800 000 0000.";
  }

  if (values.subject.length > FIELD_LIMITS.subject) {
    errors.subject = `Please keep the subject under ${FIELD_LIMITS.subject} characters.`;
  }

  if (requireMessage) {
    if (!values.message) {
      errors.message = "Please tell us how we can help.";
    } else if (values.message.length < 10) {
      errors.message = "Please add a little more detail (at least 10 characters).";
    }
  }

  if (values.message.length > FIELD_LIMITS.message) {
    errors.message = `Please keep your message under ${FIELD_LIMITS.message} characters.`;
  }

  return errors;
}

export function hasErrors(errors: EnquiryErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** First error message, for the form-level summary / API response. */
export function firstError(errors: EnquiryErrors): string | undefined {
  const order: EnquiryField[] = ["name", "email", "phone", "subject", "message"];
  for (const field of order) {
    if (errors[field]) return errors[field];
  }
  return undefined;
}
