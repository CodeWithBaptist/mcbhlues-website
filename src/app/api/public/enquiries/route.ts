import { NextResponse } from "next/server";
import { createEnquiry } from "@/lib/enquiries/enquiry-service";
import { sendEnquiryAutoReply } from "@/lib/enquiries/enquiry-email";
import { notifyPermissionHolders } from "@/lib/notifications/notification-service";
import { recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/public/enquiries — unauthenticated endpoint used by the public
 * website (contact page + property inquiry forms). Validates the payload,
 * stores the enquiry and alerts the enquiries team. A honeypot field
 * (`company`) quietly drops bot submissions.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Honeypot — real visitors never see or fill this field.
  if (typeof body?.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!message && !body?.subject) {
    return NextResponse.json({ error: "Please tell us how we can help." }, { status: 400 });
  }

  const type = body?.type === "property" || body?.type === "viewing" ? body.type : "general";

  const enquiry = await createEnquiry(
    {
      name,
      email,
      phone: typeof body?.phone === "string" ? body.phone : "",
      subject: typeof body?.subject === "string" ? body.subject : "",
      message,
      type,
      source: "website",
      status: "new",
      priority: type === "viewing" ? "high" : "normal",
      propertyId: typeof body?.propertyId === "string" && body.propertyId ? body.propertyId : null,
    },
    null
  );

  await recordAudit({
    actor: null,
    action: "enquiry.received",
    resource: "enquiry",
    resourceId: enquiry.id,
    metadata: { reference: enquiry.reference, type: enquiry.type, name: enquiry.name },
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
