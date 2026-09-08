import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/about-hero";
import { OurStory } from "@/components/sections/about/our-story";
import { OurValues } from "@/components/sections/about/our-values";
import { CTASection } from "@/components/sections/home/cta-section";
import { pageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID, jsonLdDocument, toJsonLd, webPageSchema } from "@/lib/schema";

// Statically cached and refreshed on a timer so the company details baked in
// from the layout never go stale for long; portal saves purge the cache too.
export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

const ABOUT_DESCRIPTION =
  "Meet MCBHLUES Enterprises — a Lagos real estate firm covering consulting, property development and facility management, with one consultant on your case from first viewing to handover.";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description: ABOUT_DESCRIPTION,
  path: "/about",
  socialTitle: "About MCBHLUES Enterprises",
  socialDescription:
    "A Lagos real estate team that stays with your project: consulting, development and facility management under one roof.",
});

// The one page whose subject *is* the company: this declares that explicitly,
// pointing at the organization node the site layout already publishes.
const aboutSchema = jsonLdDocument(
  webPageSchema({
    path: "/about",
    name: "About MCBHLUES Enterprises",
    description: ABOUT_DESCRIPTION,
    type: "AboutPage",
    about: [{ "@id": ORGANIZATION_ID }],
  })
);

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(aboutSchema) }}
      />
      <AboutHero />
      <OurStory />
      <OurValues />
      <CTASection />
    </div>
  );
}
