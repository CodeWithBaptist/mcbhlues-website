import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getBookingById, updateBooking } from "@/lib/bookings/booking-service";
import { createNotification } from "@/lib/notifications/notification-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** POST /api/portal/bookings/:id/assign { userId | null } — Requires booking:assign. */
export const POST = withPermission("booking:assign", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const assignedTo = typeof body?.userId === "string" && body.userId ? body.userId : null;

  const existing = await getBookingById(id);
  if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const booking = await updateBooking(id, { assignedTo });
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.BOOKING_ASSIGNED,
    resource: "booking",
    resourceId: id,
    metadata: { reference: existing.reference, assignedTo },
  });

  if (assignedTo && assignedTo !== user.id) {
    await createNotification({
      userId: assignedTo,
      title: `Booking ${existing.reference} assigned to you`,
      body: `${existing.type} with ${existing.name}`,
      kind: "booking",
      link: "/portal/bookings",
      createdBy: user.id,
    });
  }

  return NextResponse.json({ booking });
});
