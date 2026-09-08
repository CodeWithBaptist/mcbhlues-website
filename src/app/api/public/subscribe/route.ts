import { NextResponse } from "next/server";
import { normaliseSubscriberEmail, validateSubscriptionEmail } from "@/lib/newsletter/subscription";
import { sendNewsletterWelcomeEmail } from "@/lib/newsletter/welcome-email";
import { addSubscriber } from "@/lib/subscribers/subscriber-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * POST /api/public/subscribe — unauthenticated endpoint behind the site's
 * newsletter prompt.
 *
 * Same defence-in-depth shape as `/api/public/enquiries`, cheapest check
 * first. There is no Cloudflare Turnstile here on purpose: a one-field sign-up
 * should not carry a challenge widget, so the honeypot plus the two rate-limit
 * windows do the work instead.
 *
 *   1. Body-size cap         — no megabyte payloads.
 *   2. Burst rate limit      — every request, valid or not.
 *   3. Honeypot (`company`)  — invisible field only bots fill in.
 *   4. Address validation    — the same rules the browser applied, re-run.
 *   5. Acceptance limit      — only well-formed addresses consume this.
 *
 * A successful call writes a real row (see `lib/subscribers`), so the form's
 * success state is reporting something that actually happened. It then does the
 * two follow-ups a sign-up owes:
 *
 *   • the address is listed in the Staff Portal under Newsletter
 *     (Portal → Content → Newsletter), and
 *   • the visitor receives the "Newsletter welcome" auto-reply, editable under
 *     System Settings → Email templates.
 *
 * Neither follow-up can fail the sign-up: both are best-effort and the email
 * attempt is always written to the outbox for auditing.
 */

const BURST_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
const ACCEPT_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

/** One field is a few dozen bytes; this only exists to reject nonsense. */
const MAX_BODY_BYTES = 4 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That request is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // 2. Burst limit — counts every attempt, including rejected ones.
  const ip = clientIp(request);
  const burst = rateLimit(`subscribe:burst:${ip}`, BURST_LIMIT);
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many requests from this connection. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfter) } }
    );
  }

  // 3. Honeypot — real visitors never see or fill this field. Answer 201 so a
  //    bot gets no signal that it was caught.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // 4. Validation — never trust the browser's copy of these rules.
  const error = validateSubscriptionEmail(body.email);
  if (error) {
    return NextResponse.json({ error, fields: { email: error } }, { status: 400 });
  }

  // 5. Acceptance limit — only well-formed addresses consume this allowance.
  const accepted = rateLimit(`subscribe:accept:${ip}`, ACCEPT_LIMIT);
  if (!accepted.ok) {
    return NextResponse.json(
      { error: "That address has already been added. Give us a moment and try again." },
      { status: 429, headers: { "Retry-After": String(accepted.retryAfter) } }
    );
  }

  const email = normaliseSubscriberEmail(body.email);

  try {
    const result = await addSubscriber(email);

    // The auto-reply. A sign-up that already sits on the list gets no second
    // welcome, but someone who had opted out and came back does — they need to
    // see that the re-subscription landed. A delivery failure never undoes a
    // stored address; the outbox records what happened either way.
    let welcomeSent = false;
    if (!result.alreadySubscribed || result.reactivated) {
      try {
        const welcome = await sendNewsletterWelcomeEmail({ email });
        welcomeSent = welcome.status === "sent";
      } catch (error) {
        // Swallowed on purpose — `sendEmail` already logged the failure.
        console.error("[subscribe] welcome email failed", error);
      }
    }

    await recordAudit({
      actor: null,
      action: result.alreadySubscribed ? AUDIT_ACTIONS.SUBSCRIBER_REPEATED : AUDIT_ACTIONS.SUBSCRIBER_ADDED,
      resource: "subscriber",
      resourceId: result.id,
      // No address in the log — the audit trail records that a sign-up happened
      // without becoming a second copy of the list.
      metadata: { source: "website", welcomeSent },
    });

    return NextResponse.json(
      {
        ok: true,
        alreadySubscribed: result.alreadySubscribed,
        // Lets the form tell the visitor where to look, and lets the tests
        // assert the auto-reply was attempted without a live SMTP server.
        welcomeSent,
      },
      { status: result.alreadySubscribed ? 200 : 201 }
    );
  } catch (error) {
    console.error("[subscribe] failed to store sign-up", error);
    return NextResponse.json(
      { error: "We couldn't add that address just now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
