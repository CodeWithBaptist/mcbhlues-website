import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getEnquiryById, updateEnquiry } from "@/lib/enquiries/enquiry-service";
import { createNotification } from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** POST /api/portal/enquiries/:id/assign { userId | null } — Requires enquiry:assign. */
export const POST = withPermission("enquiry:assign", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const assignedTo = typeof body?.userId === "string" && body.userId ? body.userId : null;

  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  const enquiry = await updateEnquiry(id, { assignedTo });
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_ASSIGNED,
    resource: "enquiry",
    resourceId: id,
    metadata: { reference: existing.reference, assignedTo },
  });

  if (assignedTo && assignedTo !== user.id) {
    await createNotification({
      userId: assignedTo,
      title: `Enquiry ${existing.reference} assigned to you`,
      body: existing.subject || existing.name,
      kind: "enquiry",
      link: "/portal/enquiries",
      createdBy: user.id,
    });
  }

  return NextResponse.json({ enquiry });
});
