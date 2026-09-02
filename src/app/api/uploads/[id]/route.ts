import { NextResponse } from "next/server";
import { readUpload } from "@/lib/media/upload-service";

export const runtime = "nodejs";

/**
 * GET /api/uploads/:id — serve a stored file.
 *
 * Public on purpose: these bytes back property photos and the site logo, which
 * are rendered on the public website. Only the *creation* of an upload is
 * permission-gated.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const row = await readUpload(id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const bytes = Buffer.from(row.data, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${row.fileName.replace(/"/g, "")}"`,
    },
  });
}
