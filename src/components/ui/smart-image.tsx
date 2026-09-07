"use client";

import Image from "next/image";

/**
 * Image wrapper that routes through the Next.js optimizer (AVIF/WebP, correct
 * responsive sizes, lazy loading) **only** for hosts declared in
 * `next.config.ts → images.remotePatterns`.
 *
 * Why not use `next/image` everywhere? Property photos and logos are entered by
 * staff in the portal and can point at any domain. `next/image` responds 400 to
 * an un-allowlisted host, which would break real listings. Those URLs fall back
 * to a plain `<img>` that still gets `loading="lazy"` and `decoding="async"`.
 */

/** Keep in sync with `images.remotePatterns` in next.config.ts. */
const OPTIMIZABLE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
  "picsum.photos",
  "fastly.picsum.photos",
]);

export function canOptimize(src: string): boolean {
  if (!src) return false;
  // Same-origin paths (/api/uploads/…, /og-image.jpg) are always optimizable.
  if (src.startsWith("//")) return false;
  if (src.startsWith("/")) return true;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type SmartImageProps = {
  src: string;
  /**
   * Required. Pass `alt=""` **only** for purely decorative images — every
   * meaningful image on this site must describe itself.
   */
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
} & (
  | { fill: true; width?: never; height?: never }
  | { fill?: false; width: number; height: number }
);

export function SmartImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  ...dimensions
}: SmartImageProps) {
  if (canOptimize(src)) {
    // `priority` already implies eager loading — passing both makes Next warn.
    const loadingProps = priority ? { priority: true } : { loading: "lazy" as const };

    if (dimensions.fill) {
      return <Image src={src} alt={alt} className={className} sizes={sizes} fill {...loadingProps} />;
    }
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        sizes={sizes}
        width={dimensions.width}
        height={dimensions.height}
        {...loadingProps}
      />
    );
  }

  return (
    /* Staff-supplied URL on an un-allowlisted host; the optimizer would reject
       it, so serve it directly — still lazy-loaded and async-decoded. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      {...(dimensions.fill
        ? {}
        : { width: dimensions.width, height: dimensions.height })}
    />
  );
}
