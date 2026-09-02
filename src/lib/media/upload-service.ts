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

/** Images only, plus PDFs for the document library. */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
] as const;

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
    return "Unsupported file type. Upload a JPG, PNG, WebP, GIF, AVIF, SVG or PDF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${
      MAX_UPLOAD_BYTES / (1024 * 1024)
    } MB.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
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
