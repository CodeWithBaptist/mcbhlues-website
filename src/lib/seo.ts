import type { Metadata } from "next";
import { SITE_CONFIG, SITE_URL } from "@/constants";

/**
 * Page metadata builder.
 *
 * Next.js **replaces** the parent `openGraph` object wholesale when a child
 * route defines one — it is not deep-merged. Building it here keeps
 * `og:type`, `og:site_name`, `og:locale` and the social preview image on every
 * page instead of silently dropping them.
 *
 * `og:site_name` is the brand (`MCBHLUES`), matching the wordmark and the
 * `WebSite` schema node; the full business name (`MCBHLUES Enterprises`) rides
 * in the title suffix instead, so both names appear without either crowding
 * out the other.
 */

export const DEFAULT_OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: `${SITE_CONFIG.name} — real estate consulting, property development and facility management in Lagos, Nigeria`,
};

export interface PageMetadataInput {
  /** Goes through the root `%s | MCBHLUES Enterprises` template. */
  title: string;
  description: string;
  /** Absolute path, e.g. `/about`. Used for the canonical and `og:url`. */
  path: string;
  /** Overrides for the share card; default to `title` / `description`. */
  socialTitle?: string;
  socialDescription?: string;
  /** Page-specific share images (e.g. a property photo). */
  images?: { url: string; alt: string }[];
  type?: "website" | "article";
  robots?: Metadata["robots"];
}

export function pageMetadata({
  title,
  description,
  path,
  socialTitle,
  socialDescription,
  images,
  type = "website",
  robots,
}: PageMetadataInput): Metadata {
  const ogTitle = socialTitle ?? `${title} | ${SITE_CONFIG.name}`;
  const ogDescription = socialDescription ?? description;
  const ogImages = images?.length ? images : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_CONFIG.brand,
      locale: "en_NG",
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      title: ogTitle,
      description: ogDescription,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImages.map((image) => image.url),
    },
    ...(robots ? { robots } : {}),
  };
}
