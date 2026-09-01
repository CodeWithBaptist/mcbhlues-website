import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import {
  deleteEnquiry,
  getEnquiryById,
  getEnquiryDetails,
  updateEnquiry,
} from "@/lib/enquiries/enquiry-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/enquiries/:id — full enquiry with its notes/responses thread. */
export const GET = withPermission(
  ["enquiry:read", "enquiry:property_read", "enquiry:assigned_read"],
  async (_request, { params, user }) => {
    const { id } = await params;
    const enquiry = await getEnquiryDetails(id);
    if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

    // Scoped readers may only fetch enquiries inside their scope.
    if (!user.permissions.includes("enquiry:read")) {
      const canProperty = user.permissions.includes("enquiry:property_read") && enquiry.propertyId;
      const canAssigned = user.permissions.includes("enquiry:assigned_read") && enquiry.assignedTo === user.id;
      if (!canProperty && !canAssigned) {
        return NextResponse.json({ error: "Not permitted." }, { status: 403 });
      }
    }
    return NextResponse.json({ enquiry });
  }
);

/** PATCH /api/portal/enquiries/:id — edit enquiry details. Requires enquiry:update. */
export const PATCH = withPermission("enquiry:update", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const enquiry = await updateEnquiry(id, {
    name: typeof body?.name === "string" ? body.name : undefined,
    email: typeof body?.email === "string" ? body.email : undefined,
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    subject: typeof body?.subject === "string" ? body.subject : undefined,
    message: typeof body?.message === "string" ? body.message : undefined,
    type: typeof body?.type === "string" ? body.type : undefined,
    source: typeof body?.source === "string" ? body.source : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    priority: typeof body?.priority === "string" ? body.priority : undefined,
    propertyId: body?.propertyId === null ? null : typeof body?.propertyId === "string" ? body.propertyId || null : undefined,
    customerId: body?.customerId === null ? null : typeof body?.customerId === "string" ? body.customerId || null : undefined,
    assignedTo: body?.assignedTo === null ? null : typeof body?.assignedTo === "string" ? body.assignedTo || null : undefined,
  });

  if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_UPDATED,
    resource: "enquiry",
    resourceId: id,
    metadata: { reference: enquiry.reference },
  });

  return NextResponse.json({ enquiry });
});

/** DELETE /api/portal/enquiries/:id — remove an enquiry. Requires enquiry:delete. */
export const DELETE = withPermission("enquiry:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  await deleteEnquiry(id);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_DELETED,
    resource: "enquiry",
    resourceId: id,
    metadata: { reference: existing.reference, name: existing.name },
  });

  return NextResponse.json({ ok: true });
});
