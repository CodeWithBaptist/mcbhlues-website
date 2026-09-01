import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { deleteMediaAsset, updateMediaAsset } from "@/lib/media/media-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** PATCH /api/portal/media/:id — edit metadata. Requires media:upload. */
export const PATCH = withPermission("media:upload", async (request, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const asset = await updateMediaAsset(id, {
    title: typeof body?.title === "string" ? body.title : undefined,
    url: typeof body?.url === "string" ? body.url : undefined,
    kind: typeof body?.kind === "string" ? body.kind : undefined,
    folder: typeof body?.folder === "string" ? body.folder : undefined,
    alt: typeof body?.alt === "string" ? body.alt : undefined,
  });

  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.MEDIA_UPDATED,
    resource: "media_asset",
    resourceId: id,
    metadata: { title: asset.title },
  });

  return NextResponse.json({ asset });
});

/** DELETE /api/portal/media/:id — Requires media:delete. */
export const DELETE = withPermission("media:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const deleted = await deleteMediaAsset(id);
  if (!deleted) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.MEDIA_DELETED,
    resource: "media_asset",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
});
