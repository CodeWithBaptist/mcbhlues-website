"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsent } from "@/lib/consent";

/**
 * Analytics, gated on cookie consent.
 *
 * - **Vercel Web Analytics** (page views, referrers, countries) only mounts
 *   once the visitor has accepted. It is cookieless, but it is still
 *   non-essential, so it waits for a decision.
 * - **Vercel Speed Insights** collects Core Web Vitals (LCP/INP/CLS) with no
 *   cookies and no identifiers. It is loaded unconditionally as a strictly
 *   necessary performance measure and is documented as such in the Privacy
 *   Policy.
 *
 * Both are no-ops outside a Vercel deployment, so local development stays
 * quiet and no requests are made.
 */
export function SiteAnalytics() {
  const consent = useConsent();

  return (
    <>
      {consent?.analytics === true && <Analytics />}
      <SpeedInsights />
    </>
  );
}
