import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createEnquiry, loadEnquiriesForUser } from "@/lib/enquiries/enquiry-service";
import { createNotification, notifyPermissionHolders } from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * GET /api/portal/enquiries — list enquiries, honouring enquiry:read /
 * enquiry:property_read / enquiry:assigned_read scoping.
 */
export const GET = withPermission(
  ["enquiry:read", "enquiry:property_read", "enquiry:assigned_read"],
  async (_request, { user }) => {
    const list = await loadEnquiriesForUser(user);
    return NextResponse.json({ enquiries: list });
  }
);

/** POST /api/portal/enquiries — log an enquiry manually. Requires enquiry:create. */
export const POST = withPermission("enquiry:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Contact name is required." }, { status: 400 });

  const enquiry = await createEnquiry(
    {
      name,
      email: typeof body?.email === "string" ? body.email : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      subject: typeof body?.subject === "string" ? body.subject : "",
      message: typeof body?.message === "string" ? body.message : "",
      type: typeof body?.type === "string" ? body.type : "general",
      source: typeof body?.source === "string" ? body.source : "portal",
      status: typeof body?.status === "string" ? body.status : "new",
      priority: typeof body?.priority === "string" ? body.priority : "normal",
      propertyId: typeof body?.propertyId === "string" && body.propertyId ? body.propertyId : null,
      customerId: typeof body?.customerId === "string" && body.customerId ? body.customerId : null,
      assignedTo: typeof body?.assignedTo === "string" && body.assignedTo ? body.assignedTo : null,
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_CREATED,
    resource: "enquiry",
    resourceId: enquiry.id,
    metadata: { reference: enquiry.reference, source: enquiry.source },
  });

  // Keep staff in the loop.
  if (enquiry.assignedTo && enquiry.assignedTo !== user.id) {
    await createNotification({
      userId: enquiry.assignedTo,
      title: `Enquiry ${enquiry.reference} assigned to you`,
      body: enquiry.subject || enquiry.name,
      kind: "enquiry",
      link: "/portal/enquiries",
      createdBy: user.id,
    });
  } else if (!enquiry.assignedTo) {
    await notifyPermissionHolders(
      ["enquiry:read", ...(enquiry.propertyId ? ["enquiry:property_read"] : [])],
      {
        title: `New enquiry ${enquiry.reference}`,
        body: enquiry.subject || `${enquiry.name} — ${enquiry.type}`,
        kind: "enquiry",
        link: "/portal/enquiries",
        createdBy: user.id,
      }
    );
  }

  return NextResponse.json({ enquiry }, { status: 201 });
});
