import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, updateProperty } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * POST /api/portal/properties/:id/publish  { published: boolean }
 * Publishing requires property:publish; unpublishing requires property:unpublish.
 */
export const POST = withPermission(
  ["property:publish", "property:unpublish"],
  async (request, { params, user }) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const published = body?.published !== false;

    const existing = await getPropertyDetails(id);
    if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

    if (published && !user.permissions.includes("property:publish")) {
      return NextResponse.json(
        { error: "You do not have permission to publish properties." },
        { status: 403 }
      );
    }
    if (!published && !user.permissions.includes("property:unpublish")) {
      return NextResponse.json(
        { error: "You do not have permission to unpublish properties." },
        { status: 403 }
      );
    }

    const property = await updateProperty(id, { isPublished: published }, user.id);
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

    await recordAudit({
      actor: user,
      action: published ? AUDIT_ACTIONS.PROPERTY_PUBLISHED : AUDIT_ACTIONS.PROPERTY_UNPUBLISHED,
      resource: "property",
      resourceId: id,
      metadata: { title: property.title },
    });

    return NextResponse.json({ property });
  }
);
