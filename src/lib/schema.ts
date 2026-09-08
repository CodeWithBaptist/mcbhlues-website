import { SERVICES, SITE_CONFIG, SITE_URL } from "@/constants";
import type { CompanyInfo } from "@/lib/settings/company";

/**
 * schema.org JSON-LD for the public website.
 *
 * ## Branded search and entity consistency
 *
 * The company has two names and both are real:
 *
 * - **`SITE_CONFIG.brand`** — `"MCBHLUES"`, the wordmark rendered in the navbar
 *   and footer logo, and the term people actually type. This is what the
 *   *website* is called (`WebSite.name`, `og:site_name`).
 * - **`SITE_CONFIG.name`** — `"MCBHLUES Enterprises"`, the full business name.
 *   This is what the *organization* is called (`Organization.name`).
 *
 * The `brand` and `alternateName` properties on the organization node, plus the
 * matching `alternateName` on the website node, are what tell Google the two
 * names describe one entity rather than two. Nothing here is a keyword
 * placement — it is the same pairing the logo already makes visually.
 *
 * Every page refers to the organization by `@id` instead of re-describing it,
 * so the crawler sees a single entity graph rather than one near-duplicate
 * business per page.
 *
 * Only facts that already exist on the site are emitted: no founding date,
 * registration number, staff count, awards or reviews. Anything the business
 * has not published stays out.
 */

/** Stable node identifiers, shared by every page on the public site. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const BRAND_ID = `${SITE_URL}/#brand`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Pointer to the organization node, for use as a property value elsewhere. */
export const organizationRef = { "@id": ORGANIZATION_ID };

/** The company fields the schemas read. */
export type SchemaCompany = Pick<
  CompanyInfo,
  "name" | "email" | "phone" | "address" | "logoUrl" | "socials"
>;

/**
 * Serialize a graph for an inline `<script type="application/ld+json">` block.
 *
 * Company details come from Portal → Company Settings, so a `<` typed into the
 * company name must not be able to close the script tag. `\uXXXX` escapes are
 * valid inside JSON strings and parse back to the original characters.
 */
export function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&]/g, (char) => {
    if (char === "<") return "\\u003c";
    if (char === ">") return "\\u003e";
    return "\\u0026";
  });
}

/**
 * The brand node — the wordmark, as distinct from the company that owns it.
 */
export function brandSchema() {
  return {
    "@type": "Brand",
    "@id": BRAND_ID,
    name: SITE_CONFIG.brand,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.jpg`,
  };
}

/**
 * The business behind the website.
 *
 * `RealEstateAgent` is a schema.org subtype of `LocalBusiness`/`Organization`,
 * so this node *is* the Organization node — it just carries the more specific
 * type Google uses for real-estate business cards.
 */
export function organizationSchema(company: SchemaCompany) {
  const logo = company.logoUrl ? `${SITE_URL}${company.logoUrl}` : `${SITE_URL}/og-image.jpg`;

  return {
    "@type": "RealEstateAgent",
    "@id": ORGANIZATION_ID,
    // The registered business name…
    name: company.name,
    // …and the brand the public knows it by, tied back to the same node.
    alternateName: [SITE_CONFIG.brand],
    brand: { "@id": BRAND_ID },
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    logo,
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
    // Only rendered when a real profile URL has been saved in the portal.
    sameAs: Object.values(company.socials).filter(Boolean),
    knowsAbout: [
      "Real estate consulting",
      "Property development",
      "Facility management",
    ],
    // The three services the site already advertises — no more, no less.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${SITE_CONFIG.brand} services`,
      itemListElement: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.title },
      })),
    },
  };
}

/**
 * The website itself. Named after the brand, with the business name as its
 * alternate, and pointed at the organization that publishes it.
 */
export function websiteSchema(companyName: string) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_CONFIG.brand,
    alternateName: companyName,
    description: SITE_CONFIG.description,
    inLanguage: "en-NG",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * The whole graph, rendered once in the site layout so it is present on every
 * public page — including property listings, which live in the same segment.
 */
export function siteSchemaGraph(company: SchemaCompany) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      brandSchema(),
      organizationSchema(company),
      websiteSchema(company.name),
    ],
  };
}

export interface WebPageSchemaInput {
  /** Absolute path, e.g. `/about`. */
  path: string;
  name: string;
  description?: string;
  /** Additional `@type` values, e.g. `"AboutPage"`. */
  type?: string;
  /** Entities this page is about, as `@id` references. */
  about?: Record<string, string>[];
}

/**
 * A page node. Ties one URL to the site and to whatever entity it describes,
 * so an About page or a listing is explicitly *about* something Google already
 * knows from the site-wide graph.
 *
 * Returns a bare node — wrap it in {@link jsonLdDocument} when it is the only
 * thing in a `<script type="application/ld+json">` block.
 */
export function webPageSchema({
  path,
  name,
  description,
  type,
  about,
}: WebPageSchemaInput) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    "@type": type ? ["WebPage", type] : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    inLanguage: "en-NG",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    ...(about?.length ? { about } : {}),
  };
}

/** Wrap a single node so it can stand alone as a JSON-LD document. */
export function jsonLdDocument(node: Record<string, unknown>): Record<string, unknown> {
  return { "@context": "https://schema.org", ...node };
}
