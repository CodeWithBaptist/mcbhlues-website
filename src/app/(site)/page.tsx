import { Hero } from "@/components/sections/home/hero";
import { ServicesSection } from "@/components/sections/home/services-section";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";
import { WhyChooseUs } from "@/components/sections/home/why-choose-us";
import { CTASection } from "@/components/sections/home/cta-section";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <ServicesSection />
      <FeaturedProperties />
      <WhyChooseUs />
      <CTASection />
    </div>
  );
}
