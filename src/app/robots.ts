import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants";

/**
 * robots.txt. Everything public is crawlable; the Staff Portal, the JSON API
 * and the client-only Favorites page are not (they hold no indexable content
 * and Favorites is per-visitor localStorage state).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal", "/portal/", "/admin", "/api/", "/favorites"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
