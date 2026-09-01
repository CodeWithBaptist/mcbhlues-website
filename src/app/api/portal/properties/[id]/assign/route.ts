import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { assignProperty, getPropertyDetails, unassignProperty } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/portal/properties/:id/assign  { userId } | { userId, unassign: true }
 * Assigns (or unassigns) a staff member to the property. Requires property:assign.
 */
export const POST = withPermission("property:assign", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const unassign = body?.unassign === true;

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  if (unassign) {
    await unassignProperty(id, userId);
    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.PROPERTY_UNASSIGNED,
      resource: "property",
      resourceId: id,
      metadata: { userId },
    });
  } else {
    await assignProperty(id, userId, user.id);
    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.PROPERTY_ASSIGNED,
      resource: "property",
      resourceId: id,
      metadata: { userId },
    });
  }

  const refreshed = await getPropertyDetails(id);
  return NextResponse.json({ assignedUserIds: refreshed?.assignedUserIds ?? [] });
});
