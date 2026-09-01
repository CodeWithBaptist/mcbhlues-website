import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, updateProperty } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

const VALID_STATUSES = ["available", "sold", "pending", "rented"];

/**
 * POST /api/portal/properties/:id/status  { status: "available" | "sold" | ... }
 * Requires property:status_update.
 */
export const POST = withPermission("property:status_update", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const property = await updateProperty(id, { status }, user.id);
  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_STATUS_CHANGED,
    resource: "property",
    resourceId: id,
    metadata: { from: existing.status, to: status },
  });

  return NextResponse.json({ property });
});
