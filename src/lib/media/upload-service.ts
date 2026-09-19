import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { uploads } from "@/db/schema";

/**
 * Device uploads.
 *
 * Files are stored base64-encoded inside PostgreSQL rather than on disk: the
 * portal is deployed to serverless hosts with a read-only, ephemeral
 * filesystem, so anything written to `public/` would vanish between requests.
 * Storing the bytes in the database keeps "choose a file from my device" working
 * identically in local preview and in production, and every upload gets a
 * stable URL (`/api/uploads/:id`) that can be pasted anywhere a URL is accepted.
 */

/**
 * Images only, plus PDFs for the document library.
 *
 * SVG is deliberately excluded: SVG is XML and can embed <script> tags,
 * event handlers, external references, etc.  When served inline from
 * /api/uploads/:id under the application's origin (Content-Type: image/svg+xml)
 * any script inside runs in the site's origin and becomes a stored-XSS vector.
 * If SVG support is needed later, it must be served from a sandboxed subdomain
 * with a restrictive Content-Disposition: attachment or sanitised server-side.
 */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
] as const;

export type AllowedUploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

/**
 * Detects MIME type from file header magic bytes to prevent MIME-spoofing attacks.
 */
export function detectMimeType(buffer: Buffer): AllowedUploadType | null {
  if (!buffer || buffer.byteLength < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.byteLength >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer.byteLength >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.byteLength >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  // AVIF: ....ftyp followed by avif, avis, mif1
  if (buffer.byteLength >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return "image/avif";
    }
  }

  // PDF: %PDF-
  if (buffer.byteLength >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

/** 6 MB — comfortably below serverless request body limits. */
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export interface StoredUpload {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  byteSize: number;
}

export function uploadUrl(id: string): string {
  return `/api/uploads/${id}`;
}

export function validateUpload(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported file type. Upload a JPG, PNG, WebP, GIF, AVIF or PDF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${
      MAX_UPLOAD_BYTES / (1024 * 1024)
    } MB.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

export function validateUploadBuffer(buffer: Buffer): { valid: true; type: AllowedUploadType } | { valid: false; error: string } {
  if (!buffer || buffer.byteLength === 0) {
    return { valid: false, error: "That file is empty." };
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `That file is ${(buffer.byteLength / (1024 * 1024)).toFixed(1)} MB. The limit is ${
        MAX_UPLOAD_BYTES / (1024 * 1024)
      } MB.`,
    };
  }
  const detected = detectMimeType(buffer);
  if (!detected) {
    return {
      valid: false,
      error: "File content does not match any allowed file type (JPG, PNG, WebP, GIF, AVIF, PDF).",
    };
  }
  return { valid: true, type: detected };
}

export async function storeUpload(
  file: { name: string; type: string; buffer: Buffer },
  actorId: string | null
): Promise<StoredUpload> {
  const db = await getDb();
  const [created] = await db
    .insert(uploads)
    .values({
      fileName: file.name.slice(0, 200) || "upload",
      contentType: file.type || "application/octet-stream",
      byteSize: file.buffer.byteLength,
      data: file.buffer.toString("base64"),
      uploadedBy: actorId,
    })
    .returning({
      id: uploads.id,
      fileName: uploads.fileName,
      contentType: uploads.contentType,
      byteSize: uploads.byteSize,
    });

  return { ...created, url: uploadUrl(created.id) };
}

export async function readUpload(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  return row ?? null;
}
