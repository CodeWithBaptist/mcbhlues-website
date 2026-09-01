import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, setPropertyAmenities } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * PUT /api/portal/properties/:id/amenities — replace the amenity list.
 * Requires property:amenity_manage.
 */
export const PUT = withPermission("property:amenity_manage", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const amenities = Array.isArray(body?.amenities)
    ? body.amenities.map((item: { name?: unknown; icon?: unknown }) => ({
        name: String(item?.name ?? ""),
        icon: typeof item?.icon === "string" ? item.icon : "",
      }))
    : [];

  const result = await setPropertyAmenities(id, amenities);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_AMENITIES_CHANGED,
    resource: "property",
    resourceId: id,
    metadata: { count: result.length },
  });

  return NextResponse.json({ amenities: result });
});
