import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import {
  addEnquiryNote,
  getEnquiryById,
  getEnquiryDetails,
  updateEnquiry,
} from "@/lib/enquiries/enquiry-service";
import { sendEnquiryResponseEmail } from "@/lib/enquiries/enquiry-email";
import { notifyPermissionHolders } from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/portal/enquiries/:id/respond { message } — records an outward
 * response on the thread, emails it to the customer, and moves the enquiry
 * to "responded". Requires enquiry:respond.
 *
 * The response includes `email` describing delivery: "sent" (delivered to
 * the customer's inbox), "queued" (no SMTP transport configured yet) or
 * "failed" (rejected — see email.error).
 */
export const POST = withPermission("enquiry:respond", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "A response message is required." }, { status: 400 });

  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  await addEnquiryNote(id, message, "response", user);
  if (existing.status !== "responded" && existing.status !== "closed") {
    await updateEnquiry(id, { status: "responded" });
  }

  // Deliver the reply to the customer's inbox. Without an email address on
  // record there is nothing to deliver — the thread note still stands.
  const email = existing.email
    ? await sendEnquiryResponseEmail(existing, message, user)
    : { status: "skipped" as const, error: "The customer did not leave an email address." };

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_RESPONDED,
    resource: "enquiry",
    resourceId: id,
    metadata: {
      reference: existing.reference,
      emailStatus: email.status,
      ...(email.error ? { emailError: email.error } : {}),
    },
  });

  // Let the rest of the enquiries team know this one has been handled.
  await notifyPermissionHolders(["enquiry:read"], {
    title: `Enquiry ${existing.reference} was answered`,
    body: `${existing.name} — handled by ${user.email}`,
    kind: "enquiry",
    link: "/portal/enquiries",
    createdBy: user.id,
  });

  const enquiry = await getEnquiryDetails(id);
  return NextResponse.json({ enquiry, email });
});
