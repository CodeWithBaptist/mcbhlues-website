import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createBooking, loadBookingsForUser } from "@/lib/bookings/booking-service";
import { createNotification, notifyPermissionHolders } from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * GET /api/portal/bookings — list bookings, honouring booking:read /
 * booking:property_read / booking:assigned_read scoping.
 */
export const GET = withPermission(
  ["booking:read", "booking:property_read", "booking:assigned_read"],
  async (_request, { user }) => {
    const list = await loadBookingsForUser(user);
    return NextResponse.json({ bookings: list });
  }
);

/** POST /api/portal/bookings — create a booking. Requires booking:create. */
export const POST = withPermission("booking:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";
  if (!name) return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
  if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
    return NextResponse.json({ error: "A valid scheduled date/time is required." }, { status: 400 });
  }

  const booking = await createBooking(
    {
      name,
      scheduledAt,
      type: typeof body?.type === "string" ? body.type : "viewing",
      status: typeof body?.status === "string" ? body.status : "pending",
      email: typeof body?.email === "string" ? body.email : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      propertyId: typeof body?.propertyId === "string" && body.propertyId ? body.propertyId : null,
      customerId: typeof body?.customerId === "string" && body.customerId ? body.customerId : null,
      assignedTo: typeof body?.assignedTo === "string" && body.assignedTo ? body.assignedTo : null,
      durationMinutes: Number.isFinite(Number(body?.durationMinutes)) ? Number(body.durationMinutes) : 60,
      location: typeof body?.location === "string" ? body.location : "",
      notes: typeof body?.notes === "string" ? body.notes : "",
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.BOOKING_CREATED,
    resource: "booking",
    resourceId: booking.id,
    metadata: { reference: booking.reference, type: booking.type, scheduledAt: booking.scheduledAt },
  });

  if (booking.assignedTo && booking.assignedTo !== user.id) {
    await createNotification({
      userId: booking.assignedTo,
      title: `Booking ${booking.reference} assigned to you`,
      body: `${booking.type} with ${booking.name}`,
      kind: "booking",
      link: "/portal/bookings",
      createdBy: user.id,
    });
  } else {
    await notifyPermissionHolders(["booking:read"], {
      title: `New booking ${booking.reference}`,
      body: `${booking.type} with ${booking.name}`,
      kind: "booking",
      link: "/portal/bookings",
      createdBy: user.id,
    });
  }

  return NextResponse.json({ booking }, { status: 201 });
});
