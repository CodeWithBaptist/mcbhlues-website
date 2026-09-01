import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createMediaAsset, listMediaAssets, MEDIA_KINDS } from "@/lib/media/media-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/media — Requires media:read. */
export const GET = withPermission("media:read", async () => {
  const assets = await listMediaAssets();
  return NextResponse.json({ assets });
});

/**
 * POST /api/portal/media — register a media asset by URL.
 * Images need media:upload; documents media:documents; logos media:logo.
 */
export const POST = withPermission(
  ["media:upload", "media:documents", "media:logo"],
  async (request, { user }) => {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const kind = typeof body?.kind === "string" ? body.kind : "image";

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
    }
    if (!(MEDIA_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ error: `Kind must be one of: ${MEDIA_KINDS.join(", ")}.` }, { status: 400 });
    }

    const required = kind === "document" ? "media:documents" : kind === "logo" ? "media:logo" : "media:upload";
    if (!user.permissions.includes(required)) {
      return NextResponse.json(
        { error: `Adding ${kind}s requires ${required}.`, requiredPermissions: [required] },
        { status: 403 }
      );
    }

    const asset = await createMediaAsset(
      {
        title,
        url,
        kind,
        folder: typeof body?.folder === "string" ? body.folder : "general",
        alt: typeof body?.alt === "string" ? body.alt : "",
      },
      user.id
    );

    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.MEDIA_ADDED,
      resource: "media_asset",
      resourceId: asset.id,
      metadata: { title: asset.title, kind: asset.kind },
    });

    return NextResponse.json({ asset }, { status: 201 });
  }
);
