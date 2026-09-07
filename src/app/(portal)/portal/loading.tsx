import { PortalPageSkeleton } from "@/components/ui/skeletons";

/**
 * Shown the moment a portal navigation starts, while the page's server queries
 * (and its permission checks) run. Keeps the workspace responsive rather than
 * freezing on the previous page.
 */
export default function Loading() {
  return <PortalPageSkeleton />;
}
