import { NextResponse, type NextRequest } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getPropertyDetails, setPropertyImages } from "@/lib/properties/property-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * PUT /api/portal/properties/:id/images — replace the full image set.
 * Requires property:image_manage.
 */
export const PUT = withPermission("property:image_manage", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getPropertyDetails(id);
  if (!existing) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const images = Array.isArray(body?.images)
    ? body.images
        .filter((image: unknown) => image && typeof (image as { url?: unknown }).url === "string")
        .map((image: { url: string; alt?: string; isPrimary?: boolean }) => ({
          url: (image.url as string).trim(),
          alt: image.alt ?? "",
          isPrimary: Boolean(image.isPrimary),
        }))
    : [];

  const result = await setPropertyImages(id, images);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PROPERTY_IMAGES_CHANGED,
    resource: "property",
    resourceId: id,
    metadata: { count: result.length },
  });

  return NextResponse.json({ images: result });
});
