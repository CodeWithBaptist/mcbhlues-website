import { SitePageSkeleton } from "@/components/ui/skeletons";

/**
 * Instant feedback while a page's server data (CMS content, listings, company
 * settings) is fetched — every public route is dynamic, so navigation always
 * waits on the database. The skeleton mirrors the real page shape so nothing
 * jumps when the content arrives.
 */
export default function Loading() {
  return <SitePageSkeleton />;
}
