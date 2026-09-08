import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { BackToTop } from "@/components/layout/back-to-top";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { getCompanyInfo } from "@/lib/settings/company";
import { siteSchemaGraph, toJsonLd } from "@/lib/schema";

// Cached at the edge (stale-while-revalidate) instead of re-rendered on every
// click — the company info and banner reads ride along in the cached HTML.
// Portal edits publish immediately via invalidatePublicSite(). Must stay a
// literal: segment config exports cannot reference imported values.
export const revalidate = 60;

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Portal → Company Settings is the source of truth; constants are the fallback.
  const company = await getCompanyInfo();

  // schema.org graph: the brand node, the business behind it and the website.
  // Rendered once here so every public page — listings included — describes
  // the same organization instead of its own near-duplicate. See src/lib/schema.ts.
  const schema = siteSchemaGraph(company);

  return (
    <div className="public-site flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
      />
      <ScrollProgress />
      <AnnouncementBanner />
      <Navbar phone={company.phone} logoUrl={company.logoUrl} companyName={company.name} />
      <main id="main-content" className="flex-grow pt-20">
        {children}
      </main>
      <Footer company={company} />
      <BackToTop />
      <CookieConsent />
      <SiteAnalytics />
    </div>
  );
}
