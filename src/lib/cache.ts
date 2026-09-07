import { revalidatePath } from "next/cache";

/**
 * How long a statically rendered public page stays fresh in the Vercel edge
 * cache before Next.js regenerates it in the background
 * (stale-while-revalidate).
 *
 * Visitors are always served the cached HTML instantly — no function cold
 * start, no database round trips on the click path. Regeneration happens once
 * per route per window, off the critical path, and staff edits made in the
 * portal publish immediately via `invalidatePublicSite()` below.
 *
 * NOTE: the public pages export this value as a *literal* (`export const
 * revalidate = 60`) because Next.js statically analyses segment config
 * exports and cannot trace imported constants. Keep the two in sync.
 */
export const SITE_REVALIDATE_SECONDS = 60;

/**
 * Purge every cached public page after staff change site content in the
 * portal (properties, CMS copy, announcements, testimonials, FAQs, legal
 * pages, company settings). Layout scope revalidates the whole tree under the
 * root layout in one call.
 *
 * Tolerates being invoked outside a request scope (e.g. the database
 * bootstrap at boot), where there is simply nothing to purge.
 */
export function invalidatePublicSite(): void {
  try {
    revalidatePath("/", "layout");
  } catch {
    // No request scope (boot/seed/script) — nothing cached to invalidate.
  }
}
