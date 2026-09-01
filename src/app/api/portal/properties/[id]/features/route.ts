import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, setPropertyFeatures } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * PUT /api/portal/properties/:id/features — replace the feature list.
 * Requires property:feature_manage.
 */
export const PUT = withPermission("property:feature_manage", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const features = Array.isArray(body?.features) ? body.features.map(String) : [];

  const result = await setPropertyFeatures(id, features);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_FEATURES_CHANGED,
    resource: "property",
    resourceId: id,
    metadata: { count: result.length },
  });

  return NextResponse.json({ features: result });
});
