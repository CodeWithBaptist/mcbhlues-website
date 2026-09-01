import { Metadata } from "next";
import { PropertiesHero } from "@/components/sections/properties/properties-hero";
import { PropertiesList } from "@/components/sections/properties/properties-list";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Properties",
  description: "Browse our exclusive collection of luxury real estate properties available for sale and rent.",
};

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
