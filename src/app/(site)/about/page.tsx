import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/about-hero";
import { OurStory } from "@/components/sections/about/our-story";
import { OurValues } from "@/components/sections/about/our-values";
import { CTASection } from "@/components/sections/home/cta-section";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "Meet MCBHLUES Enterprises — a Lagos real estate firm covering consulting, property development and facility management, with one consultant on your case from first viewing to handover.",
  path: "/about",
  socialTitle: "About MCBHLUES Enterprises",
  socialDescription:
    "A Lagos real estate team that stays with your project: consulting, development and facility management under one roof.",
});

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <AboutHero />
      <OurStory />
      <OurValues />
      <CTASection />
    </div>
  );
}
