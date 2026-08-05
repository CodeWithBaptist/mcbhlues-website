import { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/about-hero";
import { OurStory } from "@/components/sections/about/our-story";
import { OurValues } from "@/components/sections/about/our-values";
import { TeamSection } from "@/components/sections/about/team-section";
import { CTASection } from "@/components/sections/home/cta-section";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about MCBHLUES ENTERPRISES, our mission, values, and the team behind our luxury real estate services.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <AboutHero />
      <OurStory />
      <OurValues />
      <TeamSection />
      <CTASection />
    </div>
  );
}
