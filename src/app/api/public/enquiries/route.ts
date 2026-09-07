import { NextResponse } from "next/server";
import { createEnquiry } from "@/lib/enquiries/enquiry-service";
import { sendEnquiryAutoReply } from "@/lib/enquiries/enquiry-email";
import { notifyPermissionHolders } from "@/lib/notifications/notification-service";
import { recordAudit } from "@/lib/rbac/audit";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  firstError,
  hasErrors,
  normaliseEnquiry,
  validateEnquiry,
} from "@/lib/validation/enquiry";

/**
 * Two windows, so a visitor who mistypes their email five times is not locked
 * out for ten minutes:
 *   BURST  — every request, valid or not. Stops the endpoint being hammered.
 *   ACCEPT — only submissions that pass validation and actually get stored.
 */
const BURST_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };
const ACCEPT_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Refuse absurd payloads before parsing them. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * POST /api/public/enquiries — unauthenticated endpoint used by the public
 * website (contact page + property inquiry forms).
 *
 * Defence in depth, cheapest check first:
 *   1. Body-size cap        — no megabyte payloads.
 *   2. Burst rate limit     — 20 requests per IP per 10 minutes.
 *   3. Honeypot (`company`) — invisible field only bots fill in.
 *   4. Cloudflare Turnstile — when TURNSTILE_SECRET_KEY is configured.
 *   5. Field validation     — the same rules the browser applied, re-run here.
 *   6. Acceptance limit     — 5 *stored* enquiries per IP per 10 minutes.
 *
 * A valid submission is stored as a real enquiry and the enquiries team is
 * notified in-app immediately.
 */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That message is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // 2. Burst limit — counts every attempt, including rejected ones.
  const ip = clientIp(request);
  const burst = rateLimit(`enquiry:burst:${ip}`, BURST_LIMIT);
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many requests from this connection. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfter) } }
    );
  }

  // 3. Honeypot — real visitors never see or fill this field. Answer 201 so the
  //    bot has no signal that it was caught.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const type =
    body.type === "property" || body.type === "viewing" ? body.type : "general";

  // 4. Turnstile. Skipped (and logged) when the secret is not configured.
  const turnstile = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstile.success) {
    return NextResponse.json({ error: turnstile.reason }, { status: 403 });
  }

  // 5. Validation — property inquiries may rely on the auto-filled message.
  const errors = validateEnquiry(body, { requireMessage: type === "general" });
  if (hasErrors(errors)) {
    return NextResponse.json(
      { error: firstError(errors) ?? "Please check the form and try again.", fields: errors },
      { status: 400 }
    );
  }

  const values = normaliseEnquiry(body);
  if (!values.message && !values.subject) {
    return NextResponse.json({ error: "Please tell us how we can help." }, { status: 400 });
  }

  // 6. Acceptance limit — only well-formed submissions consume this allowance.
  const accepted = rateLimit(`enquiry:accept:${ip}`, ACCEPT_LIMIT);
  if (!accepted.ok) {
    return NextResponse.json(
      {
        error:
          "We've already received several messages from you. Please give us a little time to reply, or call us directly.",
      },
      { status: 429, headers: { "Retry-After": String(accepted.retryAfter) } }
    );
  }

  const enquiry = await createEnquiry(
    {
      name: values.name,
      email: values.email,
      phone: values.phone,
      subject: values.subject,
      message: values.message,
      type,
      source: "website",
      status: "new",
      priority: type === "viewing" ? "high" : "normal",
      propertyId:
        typeof body.propertyId === "string" && body.propertyId ? body.propertyId : null,
    },
    null
  );

  await recordAudit({
    actor: null,
    action: "enquiry.received",
    resource: "enquiry",
    resourceId: enquiry.id,
    metadata: {
      reference: enquiry.reference,
      type: enquiry.type,
      name: enquiry.name,
      captcha: turnstile.skipped ? "skipped" : "verified",
    },
  });

  await notifyPermissionHolders(
    ["enquiry:read", ...(enquiry.propertyId ? ["enquiry:property_read"] : [])],
    {
      title: `New website enquiry ${enquiry.reference}`,
      body: enquiry.subject || `${enquiry.name} — ${enquiry.type}`,
      kind: "enquiry",
      link: "/portal/enquiries",
    }
  );

  // Acknowledge the visitor instantly. Delivery problems must never break the
  // submission — the outbox records what happened.
  try {
    await sendEnquiryAutoReply(enquiry);
  } catch {
    /* swallowed on purpose */
  }

  return NextResponse.json({ ok: true, reference: enquiry.reference }, { status: 201 });
}
