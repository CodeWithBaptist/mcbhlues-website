import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { BOOKING_STATUSES, getBookingById, updateBooking } from "@/lib/bookings/booking-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/portal/bookings/:id/status { status, scheduledAt? }
 *
 * Granular permissions map to the workflow:
 *   confirmed  → booking:approve
 *   rejected   → booking:reject
 *   reschedule → booking:reschedule (moves scheduledAt, keeps status)
 *   completed / cancelled / pending → booking:status_update
 */
export const POST = withPermission(
  ["booking:approve", "booking:reject", "booking:reschedule", "booking:status_update"],
  async (request, { params, user }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = typeof body?.status === "string" ? body.status : "";
    const scheduledAt =
      typeof body?.scheduledAt === "string" && !Number.isNaN(new Date(body.scheduledAt).getTime())
        ? body.scheduledAt
        : null;

    const required =
      scheduledAt && !status
        ? "booking:reschedule"
        : status === "confirmed"
          ? "booking:approve"
          : status === "rejected"
            ? "booking:reject"
            : "booking:status_update";

    if (!user.permissions.includes(required)) {
      return NextResponse.json(
        { error: "You do not have permission for this booking action.", requiredPermissions: [required] },
        { status: 403 }
      );
    }

    if (status && !(BOOKING_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${BOOKING_STATUSES.join(", ")}.` },
        { status: 400 }
      );
    }

    const existing = await getBookingById(id);
    if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const reschedule = scheduledAt && required === "booking:reschedule";
    const booking = await updateBooking(id, {
      status: status || undefined,
      scheduledAt: scheduledAt ?? undefined,
    });

    await recordAudit({
      actor: user,
      action: reschedule ? AUDIT_ACTIONS.BOOKING_RESCHEDULED : AUDIT_ACTIONS.BOOKING_STATUS_CHANGED,
      resource: "booking",
      resourceId: id,
      metadata: {
        reference: existing.reference,
        from: existing.status,
        to: booking?.status,
        scheduledAt: booking?.scheduledAt,
      },
    });

    return NextResponse.json({ booking });
  }
);
