import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteProperty, getPropertyDetails, updateProperty } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * GET /api/portal/properties/:id — a single property with all its related data.
 * Requires any property read permission.
 */
export const GET = withPermission(
  ["property:read", "property:read_available", "property:assigned_read"],
  async (_request, { params }) => {
    const { id } = await params;
    const property = await getPropertyDetails(id);
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });
    return NextResponse.json({ property });
  }
);

/** PATCH /api/portal/properties/:id — edit property fields. Requires property:update. */
export const PATCH = withPermission("property:update", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const property = await updateProperty(id, {
    title: typeof body?.title === "string" ? body.title : undefined,
    description: typeof body?.description === "string" ? body.description : undefined,
    type: body?.type === "rent" || body?.type === "sale" ? body.type : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    price: body?.price !== undefined ? num(body.price) : undefined,
    currency: typeof body?.currency === "string" ? body.currency : undefined,
    beds: body?.beds !== undefined ? num(body.beds) : undefined,
    baths: body?.baths !== undefined ? num(body.baths) : undefined,
    sqft: body?.sqft !== undefined ? num(body.sqft) : undefined,
    yearBuilt: body?.yearBuilt !== undefined ? num(body.yearBuilt, 0) || null : undefined,
    address: typeof body?.address === "string" ? body.address : undefined,
    city: typeof body?.city === "string" ? body.city : undefined,
    state: typeof body?.state === "string" ? body.state : undefined,
    postalCode: typeof body?.postalCode === "string" ? body.postalCode : undefined,
    country: typeof body?.country === "string" ? body.country : undefined,
    latitude: typeof body?.latitude === "string" ? body.latitude : undefined,
    longitude: typeof body?.longitude === "string" ? body.longitude : undefined,
    googleMapsUrl: typeof body?.googleMapsUrl === "string" ? body.googleMapsUrl : undefined,
    isFeatured: typeof body?.isFeatured === "boolean" ? body.isFeatured : undefined,
    isPublished: typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
  }, user.id);

  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_UPDATED,
    resource: "property",
    resourceId: id,
    metadata: {
      title: property.title,
      priceChanged: property.price !== existing.price,
      statusChanged: property.status !== existing.status,
      locationChanged:
        property.latitude !== existing.latitude ||
        property.longitude !== existing.longitude ||
        property.googleMapsUrl !== existing.googleMapsUrl,
    },
  });

  return NextResponse.json({ property });
});

/** DELETE /api/portal/properties/:id — remove a property. Requires property:delete. */
export const DELETE = withPermission("property:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  await deleteProperty(id);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_DELETED,
    resource: "property",
    resourceId: id,
    metadata: { title: existing.title },
  });

  return NextResponse.json({ ok: true });
});
