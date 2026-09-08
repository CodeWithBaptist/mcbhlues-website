import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { BackToTop } from "@/components/layout/back-to-top";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { getCompanyInfo } from "@/lib/settings/company";
import { SITE_CONFIG, SITE_URL } from "@/constants";

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

  // schema.org RealEstateAgent — gives Google the business card for rich results.
  const organisationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#organization`,
    name: company.name,
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    logo: company.logoUrl ? `${SITE_URL}${company.logoUrl}` : `${SITE_URL}/og-image.jpg`,
    description: SITE_CONFIG.description,
    email: company.email,
    telephone: company.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address,
      addressLocality: SITE_CONFIG.location.city,
      addressRegion: SITE_CONFIG.location.state,
      addressCountry: "NG",
    },
    areaServed: { "@type": "City", name: SITE_CONFIG.location.city },
    sameAs: Object.values(company.socials).filter(Boolean),
    knowsAbout: [
      "Real estate consulting",
      "Property development",
      "Facility management",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: company.name,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-NG",
  };

  return (
    <div className="public-site flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // Values come from our own settings table, not from visitor input.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organisationSchema, websiteSchema]),
        }}
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
