import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, updateProperty } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/portal/cms/featured { propertyId, featured }
 * Curates the homepage "Featured Properties" selection. Requires
 * cms:featured_properties — kept separate from property:update so content
 * managers can curate without holding property edit rights.
 */
export const POST = withPermission("cms:featured_properties", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : "";
  const featured = body?.featured === true;
  if (!propertyId) return NextResponse.json({ error: "propertyId is required." }, { status: 400 });

  const existing = await getPropertyDetails(propertyId);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  await updateProperty(propertyId, { isFeatured: featured }, user.id);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_CONTENT_UPDATED,
    resource: "property",
    resourceId: propertyId,
    metadata: { title: existing.title, isFeatured: featured },
  });

  return NextResponse.json({ ok: true, propertyId, isFeatured: featured });
});
