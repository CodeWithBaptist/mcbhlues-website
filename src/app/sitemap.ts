import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants";
import { listPublishedProperties } from "@/lib/properties/property-service";

/** Regenerate at most once an hour — listings change, not by the second. */
export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/properties", changeFrequency: "daily", priority: 0.9 },
  { path: "/buy", changeFrequency: "daily", priority: 0.9 },
  { path: "/rent", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Published listings only. A database hiccup must never 500 the sitemap —
  // crawlers treat that far worse than a temporarily shorter file.
  let propertyEntries: MetadataRoute.Sitemap = [];
  try {
    const properties = await listPublishedProperties();
    propertyEntries = properties
      .filter((property) => Boolean(property.slug))
      .map((property) => ({
        url: `${SITE_URL}/properties/${property.slug}`,
        lastModified: property.updatedAt ? new Date(property.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    propertyEntries = [];
  }

  return [...staticEntries, ...propertyEntries];
}
