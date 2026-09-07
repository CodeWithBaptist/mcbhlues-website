import type { Buffer } from "node:buffer";

/**
 * Server-side image compression for staff uploads.
 *
 * Photos come straight off a phone or a camera — routinely 4-8 MB and
 * 4000px wide — and every one of those bytes is stored in Postgres and then
 * re-read on every page view. Downscaling and re-encoding to WebP at upload
 * time typically cuts them by 85-95% with no visible quality loss, which is by
 * far the biggest page-weight win available on this site.
 *
 * `sharp` ships with Next.js and is listed as a direct dependency, but it is a
 * native module: if it ever fails to load (unsupported platform, pruned
 * install) we quietly store the original bytes rather than failing the upload.
 */

/** Nothing on the site is displayed wider than this, even on a 2x 4K screen. */
const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 80;

/** Formats worth re-encoding. GIF (may be animated) and SVG/PDF are passed through. */
const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export interface CompressionResult {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  /** Original byte length, for logging / audit metadata. */
  originalBytes: number;
  compressed: boolean;
}

function toWebpName(fileName: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}.webp`;
}

export async function compressUploadImage(file: {
  name: string;
  type: string;
  buffer: Buffer;
}): Promise<CompressionResult> {
  const untouched: CompressionResult = {
    buffer: file.buffer,
    contentType: file.type,
    fileName: file.name,
    originalBytes: file.buffer.byteLength,
    compressed: false,
  };

  if (!COMPRESSIBLE.has(file.type)) return untouched;

  try {
    const { default: sharp } = await import("sharp");

    const pipeline = sharp(file.buffer, { failOn: "none" });
    const metadata = await pipeline.metadata();

    // Animated WebP would lose its frames on re-encode — leave it alone.
    if ((metadata.pages ?? 1) > 1) return untouched;

    const needsResize =
      (metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION;

    const output = await pipeline
      .rotate() // honour the EXIF orientation flag before we strip the metadata
      .resize({
        width: needsResize ? MAX_DIMENSION : undefined,
        height: needsResize ? MAX_DIMENSION : undefined,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    // Re-encoding a small, already-optimised file can make it bigger.
    if (output.byteLength >= file.buffer.byteLength && !needsResize) {
      return untouched;
    }

    return {
      buffer: output,
      contentType: "image/webp",
      fileName: toWebpName(file.name),
      originalBytes: file.buffer.byteLength,
      compressed: true,
    };
  } catch (error) {
    console.warn("[uploads] image compression unavailable, storing original:", error);
    return untouched;
  }
}
