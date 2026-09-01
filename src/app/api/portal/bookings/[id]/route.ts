import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteBooking, getBookingById, updateBooking } from "@/lib/bookings/booking-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/bookings/:id */
export const GET = withPermission(
  ["booking:read", "booking:property_read", "booking:assigned_read"],
  async (_request, { params, user }) => {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    if (!user.permissions.includes("booking:read")) {
      const canProperty = user.permissions.includes("booking:property_read") && booking.propertyId;
      const canAssigned = user.permissions.includes("booking:assigned_read") && booking.assignedTo === user.id;
      if (!canProperty && !canAssigned) {
        return NextResponse.json({ error: "Not permitted." }, { status: 403 });
      }
    }
    return NextResponse.json({ booking });
  }
);

/** PATCH /api/portal/bookings/:id — edit a booking. Requires booking:update. */
export const PATCH = withPermission("booking:update", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getBookingById(id);
  if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const booking = await updateBooking(id, {
    type: typeof body?.type === "string" ? body.type : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    name: typeof body?.name === "string" ? body.name : undefined,
    email: typeof body?.email === "string" ? body.email : undefined,
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    propertyId: body?.propertyId === null ? null : typeof body?.propertyId === "string" ? body.propertyId || null : undefined,
    customerId: body?.customerId === null ? null : typeof body?.customerId === "string" ? body.customerId || null : undefined,
    assignedTo: body?.assignedTo === null ? null : typeof body?.assignedTo === "string" ? body.assignedTo || null : undefined,
    scheduledAt:
      typeof body?.scheduledAt === "string" && !Number.isNaN(new Date(body.scheduledAt).getTime())
        ? body.scheduledAt
        : undefined,
    durationMinutes: Number.isFinite(Number(body?.durationMinutes)) ? Number(body.durationMinutes) : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
  });

  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.BOOKING_UPDATED,
    resource: "booking",
    resourceId: id,
    metadata: { reference: booking.reference },
  });

  return NextResponse.json({ booking });
});

/** DELETE /api/portal/bookings/:id — Requires booking:delete. */
export const DELETE = withPermission("booking:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const existing = await getBookingById(id);
  if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  await deleteBooking(id);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.BOOKING_DELETED,
    resource: "booking",
    resourceId: id,
    metadata: { reference: existing.reference, name: existing.name },
  });

  return NextResponse.json({ ok: true });
});
