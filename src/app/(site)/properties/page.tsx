import { Metadata } from "next";
import { PropertiesHero } from "@/components/sections/properties/properties-hero";
import { PropertiesList } from "@/components/sections/properties/properties-list";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

export const metadata: Metadata = pageMetadata({
  title: "All Properties in Lagos",
  description:
    "Every MCBHLUES Enterprises listing in one place — houses, apartments, land and commercial space for sale and to rent across Lagos. Filter by type, price and location.",
  path: "/properties",
  socialDescription:
    "Houses, apartments, land and commercial space for sale and to rent across Lagos.",
});

export default async function PropertiesPage() {
  const properties = (await listPublishedProperties()).map(toPublicProperty);

  return (
    <div className="flex flex-col">
      <PropertiesHero />
      <PropertiesList properties={properties} />
      <CTASection />
    </div>
  );
}
