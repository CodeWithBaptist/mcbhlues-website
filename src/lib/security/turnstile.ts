/**
 * Cloudflare Turnstile — server-side token verification.
 *
 * Configuration (both required for Turnstile to be active):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public, rendered into the widget
 *   TURNSTILE_SECRET_KEY            — private, used here only
 *
 * When the secret is absent the check is **skipped** rather than failing
 * closed: an unconfigured deployment (local dev, a fresh preview) must still
 * accept genuine enquiries. The honeypot field and the IP rate limiter remain
 * active in that case, so the forms are never completely unprotected.
 */

const VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export interface TurnstileResult {
  /** True when the request may proceed. */
  success: boolean;
  /** Human-readable reason when `success` is false. */
  reason?: string;
  /** True when verification was skipped because Turnstile is not configured. */
  skipped?: boolean;
}

export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { success: true, skipped: true };

  if (typeof token !== "string" || token.trim() === "") {
    return { success: false, reason: "Please complete the security check." };
  }

  const body = new URLSearchParams({ secret, response: token.trim() });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Never let a slow Cloudflare response hang the submission.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Cloudflare itself is unhealthy — do not punish the visitor.
      console.warn(`[turnstile] siteverify returned HTTP ${response.status}`);
      return { success: true, skipped: true };
    }

    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { success: true };

    const codes = data["error-codes"] ?? [];
    // An expired/duplicated token is a normal user-facing situation.
    const expired = codes.some((code) =>
      ["timeout-or-duplicate", "invalid-input-response"].includes(code)
    );
    return {
      success: false,
      reason: expired
        ? "Your security check expired. Please try again."
        : "Security check failed. Please reload the page and try again.",
    };
  } catch (error) {
    // Network error / timeout reaching Cloudflare. Fail open — a lost genuine
    // enquiry costs more than a rare spam message that still has to clear the
    // honeypot and rate limiter.
    console.warn("[turnstile] verification unreachable:", error);
    return { success: true, skipped: true };
  }
}
