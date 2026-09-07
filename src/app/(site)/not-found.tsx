import type { Metadata } from "next";
import { NotFoundContent } from "@/components/sections/not-found-content";

/**
 * 404 for anything inside the public site that calls `notFound()` — most often
 * a property slug that no longer exists. Rendered inside the `(site)` layout,
 * so the real navbar, announcement bar and footer stay in place.
 */
export const metadata: Metadata = {
  title: "Page not found",
  description:
    "This listing or page is no longer available. Browse our current Lagos properties or talk to a consultant.",
  robots: { index: false, follow: true },
};

export default function SiteNotFound() {
  return <NotFoundContent />;
}
