import { Hero } from "@/components/sections/home/hero";
import { ServicesSection } from "@/components/sections/home/services-section";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";
import { WhyChooseUs } from "@/components/sections/home/why-choose-us";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";

export const dynamic = "force-dynamic";

export default async function Home() {
  const properties = (await listPublishedProperties()).map(toPublicProperty);

  return (
    <div className="flex flex-col">
      <Hero />
      <ServicesSection />
      <FeaturedProperties properties={properties} />
      <WhyChooseUs />
      <CTASection />
    </div>
  );
}
