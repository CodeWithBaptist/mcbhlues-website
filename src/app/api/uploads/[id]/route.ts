import { NextResponse } from "next/server";
import { readUpload } from "@/lib/media/upload-service";

export const runtime = "nodejs";

/**
 * GET /api/uploads/:id — serve a stored file.
 *
 * Public on purpose: these bytes back property photos and the site logo, which
 * are rendered on the public website. Only the *creation* of an upload is
 * permission-gated.
 *
 * Security notes:
 *   - X-Content-Type-Options: nosniff stops browsers from reclassifying a file
 *     (e.g. treating an uploaded image as HTML/JS).
 *   - Content-Security-Policy sandbox denies scripts/forms inside the response.
 *   - PDFs are served Content-Disposition: attachment so they never render in
 *     the origin and cannot run script in the site's context.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  // Validate the id shape (UUID) before hitting the DB; blocks path-traversal/odd inputs.
  if (!/^[0-9a-f-]{1,64}$/i.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const row = await readUpload(id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isPdf = row.contentType === "application/pdf";
  // Strip quotes and path separators from the file name to neutralise header injection.
  const safeName = row.fileName.replace(/[\\/"\r\n\t]/g, "_");
  const disposition = isPdf ? "attachment" : "inline";

  const bytes = Buffer.from(row.data, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox;",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
