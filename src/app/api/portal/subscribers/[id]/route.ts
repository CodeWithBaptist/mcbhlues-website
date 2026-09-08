import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { setSubscriberStatus } from "@/lib/subscribers/subscriber-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * PATCH /api/portal/subscribers/:id — put an address on or off the list.
 * Requires `subscriber:update`.
 *
 * The body is `{ status: "active" | "unsubscribed" }`. Opting someone out
 * flips the status rather than deleting the row: the record is the evidence
 * that this address asked to be left alone, and `addSubscriber` honours it if
 * they later sign up again.
 */
export const PATCH = withPermission(
  "subscriber:update",
  async (request, { params, user }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status;

    if (status !== "active" && status !== "unsubscribed") {
      return NextResponse.json(
        { error: "Status must be either \"active\" or \"unsubscribed\"." },
        { status: 400 }
      );
    }

    const subscriber = await setSubscriberStatus(id, status);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    }

    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.SUBSCRIBER_STATUS_CHANGED,
      resource: "subscriber",
      resourceId: id,
      metadata: { status },
    });

    return NextResponse.json({ subscriber });
  }
);
