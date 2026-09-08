import assert from "node:assert/strict";
import { describe, test } from "node:test";
// Pure modules: `schema.ts` imports the company type with `import type`, so
// nothing here pulls in the database.
import { SERVICES, SITE_CONFIG, SITE_URL } from "../src/constants";
import { pageMetadata } from "../src/lib/seo";
import {
  BRAND_ALIASES,
  BRAND_ID,
  ORGANIZATION_ID,
  WEBSITE_ID,
  brandSchema,
  jsonLdDocument,
  organizationSchema,
  siteSchemaGraph,
  toJsonLd,
  webPageSchema,
  websiteSchema,
} from "../src/lib/schema";
import type { SchemaCompany } from "../src/lib/schema";

const COMPANY: SchemaCompany = {
  name: "MCBHLUES Enterprises",
  email: "info@mcbhlues.com",
  phone: "+234 800 000 0000",
  address: "14 Akin Adesola Street, Victoria Island, Lagos, Nigeria",
  logoUrl: null,
  socials: { facebook: "", instagram: "", twitter: "", linkedin: "" },
};

/**
 * The point of this suite is entity consistency: the brand and the business
 * name must be tied to one organization node, and nothing may be asserted
 * about the company that the website does not already publish.
 */
describe("organizationSchema", () => {
  const org = organizationSchema(COMPANY);

  test("names the business, not the wordmark", () => {
    assert.equal(org.name, "MCBHLUES Enterprises");
  });

  test("ties the brand back to the same entity", () => {
    // The wordmark, the business name and the search variants (#21), all
    // pointing at one organization node.
    assert.deepEqual(org.alternateName, [
      SITE_CONFIG.brand,
      COMPANY.name,
      ...BRAND_ALIASES,
    ]);
    assert.ok(org.alternateName.includes(SITE_CONFIG.brand));
    assert.deepEqual(org.brand, { "@id": BRAND_ID });
    assert.equal(brandSchema().name, SITE_CONFIG.brand);
    assert.equal(brandSchema()["@id"], BRAND_ID);
  });

  test("keeps a stable node id so every page refers to one entity", () => {
    assert.equal(org["@id"], ORGANIZATION_ID);
    assert.match(ORGANIZATION_ID, /#organization$/);
  });

  test("lists only the services the site already advertises", () => {
    const catalog = org.hasOfferCatalog;
    assert.equal(catalog.name, `${SITE_CONFIG.brand} services`);
    assert.deepEqual(
      catalog.itemListElement.map((item) => item.itemOffered.name),
      SERVICES.map((service) => service.title)
    );
  });

  test("carries the published contact details through unchanged", () => {
    assert.equal(org.email, COMPANY.email);
    assert.equal(org.telephone, COMPANY.phone);
    assert.equal(org.address.streetAddress, COMPANY.address);
    assert.equal(org.address.addressCountry, "NG");
  });

  test("omits social profiles until a real URL is saved", () => {
    assert.deepEqual(org.sameAs, []);
    const withSocials = organizationSchema({
      ...COMPANY,
      socials: { ...COMPANY.socials, linkedin: "https://www.linkedin.com/company/x" },
    });
    assert.deepEqual(withSocials.sameAs, ["https://www.linkedin.com/company/x"]);
  });

  test("asserts nothing the website has not published", () => {
    // No founding date, registration number, staff count, awards, reviews or
    // ratings: inventing any of these would be a fabricated business claim.
    for (const forbidden of [
      "foundingDate",
      "legalName",
      "numberOfEmployees",
      "award",
      "aggregateRating",
      "review",
      "taxID",
      "vatID",
    ]) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(org, forbidden),
        false,
        `${forbidden} must not be emitted`
      );
    }
  });
});

describe("websiteSchema", () => {
  test("is named after the brand and points at the organization", () => {
    const site = websiteSchema(COMPANY.name);
    assert.equal(site.name, SITE_CONFIG.brand);
    assert.equal(site.alternateName, "MCBHLUES Enterprises");
    assert.deepEqual(site.publisher, { "@id": ORGANIZATION_ID });
    assert.equal(site["@id"], WEBSITE_ID);
  });
});

describe("siteSchemaGraph", () => {
  test("publishes brand, organization and website as one graph", () => {
    const graph = siteSchemaGraph(COMPANY);
    assert.equal(graph["@context"], "https://schema.org");
    assert.deepEqual(
      graph["@graph"].map((node) => node["@id"]),
      [BRAND_ID, ORGANIZATION_ID, WEBSITE_ID]
    );
  });
});

describe("webPageSchema", () => {
  test("links a page to the site, the publisher and its subject", () => {
    const page = webPageSchema({
      path: "/about",
      name: "About MCBHLUES Enterprises",
      type: "AboutPage",
      about: [{ "@id": ORGANIZATION_ID }],
    });
    assert.deepEqual(page["@type"], ["WebPage", "AboutPage"]);
    assert.deepEqual(page.isPartOf, { "@id": WEBSITE_ID });
    assert.deepEqual(page.publisher, { "@id": ORGANIZATION_ID });
    assert.deepEqual(page.about, [{ "@id": ORGANIZATION_ID }]);
    assert.equal(page.url, `${SITE_URL}/about`);
    assert.equal(page["@id"], `${SITE_URL}/about#webpage`);
  });

  test("treats the homepage path as the bare origin", () => {
    const page = webPageSchema({ path: "/", name: "Home" });
    assert.equal(page.url, SITE_URL);
    assert.equal(page["@type"], "WebPage");
    assert.equal("about" in page, false);
  });

  test("jsonLdDocument adds the context a standalone node needs", () => {
    const doc = jsonLdDocument(webPageSchema({ path: "/about", name: "About" }));
    assert.equal(doc["@context"], "https://schema.org");
    assert.equal(doc["@type"], "WebPage");
  });
});

describe("toJsonLd", () => {
  test("cannot let a company name close the script tag", () => {
    const hostile = { name: `</script><script>alert("x")</script>` };
    const json = toJsonLd(hostile);
    assert.equal(json.includes("</script>"), false);
    assert.equal(json.includes("<"), false);
    assert.equal(json.includes(">"), false);
    // …and still parses back to the original value.
    assert.deepEqual(JSON.parse(json), hostile);
  });

  test("escapes ampersands without changing the parsed value", () => {
    const value = { name: "Land & Buildings" };
    const json = toJsonLd(value);
    assert.equal(json.includes("&"), false);
    assert.deepEqual(JSON.parse(json), value);
  });
});

describe("pageMetadata", () => {
  test("brands the share card and keeps the canonical", () => {
    const metadata = pageMetadata({
      title: "About Us",
      description: "d",
      path: "/about",
    });
    assert.equal(metadata.openGraph?.siteName, SITE_CONFIG.brand);
    assert.deepEqual(metadata.alternates, { canonical: "/about" });
    assert.equal(metadata.openGraph?.title, "About Us | MCBHLUES Enterprises");
  });
});
