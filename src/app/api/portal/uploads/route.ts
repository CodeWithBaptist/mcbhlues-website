import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import {
  MAX_UPLOAD_BYTES,
  storeUpload,
  validateUpload,
} from "@/lib/media/upload-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

export const runtime = "nodejs";

/**
 * POST /api/portal/uploads — accept a file picked from the user's device
 * (multipart/form-data, field name `file`) and return a stable URL for it.
 *
 * Any staff member who may attach media somewhere may upload: property images,
 * the media library and the logo slot all funnel through here, and the calling
 * route still enforces its own permission when the URL is finally saved.
 */
export const POST = withPermission(
  ["media:upload", "media:documents", "media:logo", "property:image_manage", "settings:company"],
  async (request, { user }) => {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }

    const problem = validateUpload({ type: file.type, size: file.size });
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "That file is too large." }, { status: 413 });
    }

    const stored = await storeUpload(
      { name: file.name, type: file.type, buffer },
      user.id
    );

    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.MEDIA_ADDED,
      resource: "upload",
      resourceId: stored.id,
      metadata: { fileName: stored.fileName, bytes: stored.byteSize, source: "device" },
    });

    return NextResponse.json({ upload: stored }, { status: 201 });
  }
);
