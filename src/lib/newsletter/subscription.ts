/**
 * Shared validation for the newsletter sign-up.
 *
 * Isomorphic by design: the browser runs `validateSubscriptionEmail` so the
 * visitor gets an instant answer without a round trip, and the API route runs
 * the *same* function again because a crafted request never passes through it.
 *
 * The address rules deliberately match `lib/validation/enquiry.ts` — one
 * definition of "looks like an email address" for the whole site.
 */

export const SUBSCRIBER_EMAIL_LIMIT = 254; // RFC 5321 maximum address length.

/** Pragmatic, deliberately permissive address check (RFC 5322 is not worth it). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Trim, collapse internal whitespace and lower-case, then hard-truncate to the
 * column limit. Lower-casing is what makes the uniqueness index meaningful —
 * `Ada@Example.COM` and `ada@example.com` must be the same subscriber.
 */
export function normaliseSubscriberEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, "").toLowerCase().slice(0, SUBSCRIBER_EMAIL_LIMIT);
}

/** `null` when the address is acceptable, otherwise a human-readable reason. */
export function validateSubscriptionEmail(input: unknown): string | null {
  const email = normaliseSubscriberEmail(input);

  if (!email) return "Please enter your email address.";
  if (!email.includes("@")) return "That email address is missing an @.";
  if (!EMAIL_PATTERN.test(email)) return "That email address doesn't look right.";
  return null;
}
