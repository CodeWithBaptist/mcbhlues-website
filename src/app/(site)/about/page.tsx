import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/about-hero";
import { OurStory } from "@/components/sections/about/our-story";
import { OurValues } from "@/components/sections/about/our-values";
import { CTASection } from "@/components/sections/home/cta-section";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn more about MCBHLUES Enterprises, what the firm does and how it works with buyers, owners and tenants.",
};

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
