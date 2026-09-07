import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createProperty, loadPropertiesForUser } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { DEFAULT_CURRENCY } from "@/lib/utils";

/**
 * GET /api/portal/properties — list the properties the caller may see,
 * honouring property:read / property:read_available / property:assigned_read.
 */
export const GET = withPermission(
  ["property:read", "property:read_available", "property:assigned_read"],
  async (_request, { user }) => {
    const list = await loadPropertiesForUser(user);
    return NextResponse.json({ properties: list });
  }
);

/** POST /api/portal/properties — create a property. Requires property:create. */
export const POST = withPermission("property:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Property name is required." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Property title is required." }, { status: 400 });
  }

  const property = await createProperty(
    {
      title,
      name,
      description: typeof body?.description === "string" ? body.description : "",
      type: body?.type === "rent" ? "rent" : "sale",
      status: typeof body?.status === "string" ? body.status : "available",
      price: Number.isFinite(body?.price) ? Number(body.price) : 0,
      currency: typeof body?.currency === "string" ? body.currency : DEFAULT_CURRENCY,
      beds: Number.isFinite(body?.beds) ? Number(body.beds) : 0,
      baths: Number.isFinite(body?.baths) ? Number(body.baths) : 0,
      sqft: Number.isFinite(body?.sqft) ? Number(body.sqft) : 0,
      yearBuilt: Number.isFinite(body?.yearBuilt) ? Number(body.yearBuilt) : null,
      address: typeof body?.address === "string" ? body.address : "",
      city: typeof body?.city === "string" ? body.city : "",
      state: typeof body?.state === "string" ? body.state : "",
      country: typeof body?.country === "string" ? body.country : "",
      latitude: typeof body?.latitude === "string" ? body.latitude : "",
      longitude: typeof body?.longitude === "string" ? body.longitude : "",
      isFeatured: Boolean(body?.isFeatured),
      isPublished: Boolean(body?.isPublished),
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_CREATED,
    resource: "property",
    resourceId: property.id,
    metadata: { name: property.name, type: property.type },
  });

  return NextResponse.json({ property }, { status: 201 });
});
