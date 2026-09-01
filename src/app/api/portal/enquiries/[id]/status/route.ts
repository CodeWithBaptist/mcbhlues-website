import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { ENQUIRY_STATUSES, getEnquiryById, setEnquiryStatus } from "@/lib/enquiries/enquiry-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** POST /api/portal/enquiries/:id/status { status } — Requires enquiry:status_update. */
export const POST = withPermission("enquiry:status_update", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!(ENQUIRY_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${ENQUIRY_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  const enquiry = await setEnquiryStatus(id, status);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_STATUS_CHANGED,
    resource: "enquiry",
    resourceId: id,
    metadata: { reference: existing.reference, from: existing.status, to: status },
  });

  return NextResponse.json({ enquiry });
});
