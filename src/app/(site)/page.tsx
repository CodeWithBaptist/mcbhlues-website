import { Hero } from "@/components/sections/home/hero";
import { ServicesSection } from "@/components/sections/home/services-section";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";
import { WhyChooseUs } from "@/components/sections/home/why-choose-us";
import { TestimonialsSection } from "@/components/sections/home/testimonials-section";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { getCmsValues, listPublishedTestimonials } from "@/lib/cms/cms-service";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/constants";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description:
      "MCBHLUES Enterprises helps you buy, build and manage property in Lagos. Real estate consulting, property development and facility management from one accountable team. Book a free consultation.",
    path: "/",
    socialTitle: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    socialDescription:
      "Buy, build and manage property in Lagos with one accountable team. Consulting, development and facility management.",
  }),
  // The homepage sets its own full title instead of the "%s | …" template.
  title: {
    absolute: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
  },
};

export default async function Home() {
  const [properties, cms, testimonials] = await Promise.all([
    listPublishedProperties(),
    getCmsValues().catch(() => ({} as Record<string, string>)),
    listPublishedTestimonials().catch(() => []),
  ]);

  return (
    <div className="flex flex-col">
      <Hero
        content={{
          badge: cms["home.hero_badge"] ?? "",
          title: cms["home.hero_title"] ?? "",
          subtitle: cms["home.hero_subtitle"] ?? "",
        }}
      />
      <ServicesSection />
      <FeaturedProperties properties={properties.map(toPublicProperty)} />
      <WhyChooseUs />
      <TestimonialsSection
        testimonials={testimonials.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          quote: row.quote,
          avatarUrl: row.avatarUrl,
          rating: row.rating,
        }))}
      />
      <CTASection />
    </div>
  );
}
