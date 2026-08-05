import { Metadata } from "next";
import { PropertiesHero } from "@/components/sections/properties/properties-hero";
import { PropertiesList } from "@/components/sections/properties/properties-list";
import { CTASection } from "@/components/sections/home/cta-section";

export const metadata: Metadata = {
  title: "Properties",
  description: "Browse our exclusive collection of luxury real estate properties available for sale and rent.",
};

export default function PropertiesPage() {
  return (
    <div className="flex flex-col">
      <PropertiesHero />
      <PropertiesList />
      <CTASection />
    </div>
  );
}
