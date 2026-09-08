import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PropertyHeader } from "@/components/sections/properties/details/property-header";
import { PropertyGallery } from "@/components/sections/properties/details/property-gallery";
import { PropertyContent } from "@/components/sections/properties/details/property-content";
import { PropertySidebar } from "@/components/sections/properties/details/property-sidebar";
import { PropertyMap } from "@/components/sections/properties/details/property-map";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";
import { listPublishedProperties, getPropertyBySlug } from "@/lib/properties/property-service";
import { toPublicProperty, hasMapLocation } from "@/lib/properties/public-property";
import { SITE_URL } from "@/constants";
import { pageMetadata } from "@/lib/seo";
import { toJsonLd, webPageSchema } from "@/lib/schema";

// ISR: listing pages are prerendered for every published slug, then served
// from the edge cache — regenerated in the background every 60 s and purged
// immediately when staff edit the property in the portal. Must stay a
// literal: segment config exports cannot reference imported values.
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Prerender every published listing so clicks land on cached HTML. Slugs
 * created after a deploy still render on demand (`dynamicParams` defaults to
 * true), and never fall through to a stale page thanks to the 60 s window.
 * A build-time database hiccup degrades to on-demand rendering instead of
 * failing the deploy.
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const published = await listPublishedProperties();
    return published.map((property) => ({ id: property.slug }));
  } catch {
    return [];
  }
}

/** Trim to a clean sentence boundary so meta descriptions never end mid-word. */
function clamp(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")) || cut}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const details = await getPropertyBySlug(id);

  if (!details) {
    return {
      title: "Property not found",
      description: "This listing is no longer available. Browse our current Lagos properties.",
      robots: { index: false, follow: true },
    };
  }

  const property = toPublicProperty(details);
  const action = property.type === "sale" ? "for sale" : "to rent";
  const description = clamp(
    property.description ||
      `${property.title} in ${property.location}. ${property.beds} bedrooms, ${property.baths} bathrooms, ${property.sqm} sqm.`
  );

  return pageMetadata({
    title: `${property.name} — ${property.location}`,
    description,
    path: `/properties/${property.slug}`,
    type: "article",
    socialTitle: `${property.name} ${action} in ${property.location}`,
    socialDescription: description,
    // Fall back to the brand card when a listing has no photo yet.
    images: property.image
      ? [{ url: property.image, alt: `${property.name} in ${property.location}` }]
      : undefined,
  });
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { id } = await params;
  const details = await getPropertyBySlug(id);

  if (!details) {
    notFound();
  }

  const property = toPublicProperty(details);
  const allProperties = await listPublishedProperties();
  const featured = allProperties.map(toPublicProperty);
  const showMap = hasMapLocation(property);

  // schema.org listing markup — lets Google show price, location and photos
  // directly in the search result.
  const propertyUrl = `${SITE_URL}/properties/${property.slug}`;
  const listingSchema = {
    "@type": property.type === "sale" ? "SingleFamilyResidence" : "Apartment",
    "@id": `${propertyUrl}#property`,
    name: property.name,
    description: property.description || property.title,
    url: propertyUrl,
    image: property.images.length > 0 ? property.images : undefined,
    numberOfBedrooms: property.beds || undefined,
    numberOfBathroomsTotal: property.baths || undefined,
    floorSize: property.sqm
      ? { "@type": "QuantitativeValue", value: property.sqm, unitCode: "MTK" }
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      addressLocality: property.city || undefined,
      addressRegion: property.state || undefined,
      addressCountry: property.country || "NG",
    },
    offers: property.price
      ? {
          "@type": "Offer",
          price: property.price,
          priceCurrency: property.currency || "NGN",
          availability:
            property.status === "available"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        }
      : undefined,
  };

  // A page node connecting this URL to the listing above and to the business
  // that publishes it (the organization node in the site layout), so every
  // listing sits inside the same MCBHLUES entity graph.
  const pageSchema = webPageSchema({
    path: `/properties/${property.slug}`,
    name: `${property.name} — ${property.location}`,
    description: clamp(property.description || property.title),
    about: [{ "@id": `${propertyUrl}#property` }],
  });

  return (
    <div className="flex flex-col bg-gray-50/30">
      <script
        type="application/ld+json"
        // Listing copy is staff-authored, so escape it for inline JSON-LD.
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@graph": [listingSchema, pageSchema],
          }),
        }}
      />
      <PropertyHeader property={property} />
      <PropertyGallery images={property.images} title={property.name} />
      
      <Container className="pb-24">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 flex flex-col gap-12">
            <PropertyContent
              property={property}
              amenities={property.amenities}
              features={property.features}
            />
            {showMap && (
              <PropertyMap
                location={property.location}
                query={
                  property.address
                    ? [property.address, property.city, property.state, property.country]
                        .filter(Boolean)
                        .join(", ")
                    : property.location
                }
                latitude={property.latitude}
                longitude={property.longitude}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <PropertySidebar propertyId={property.id} propertyTitle={property.name} />
          </div>
        </div>
      </Container>

      <div className="bg-white border-t border-gray-100">
        <FeaturedProperties properties={featured} />
      </div>
    </div>
  );
}
