import { Metadata } from "next";
import { BuyHero } from "@/components/sections/buy/buy-hero";
import { BuyProcess } from "@/components/sections/buy/buy-process";
import { BuyListings } from "@/components/sections/buy/buy-listings";
import { BuyFAQ } from "@/components/sections/buy/buy-faq";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { listPublishedFaqs } from "@/lib/cms/cms-service";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Property for Sale in Lagos",
  description:
    "Browse verified homes, land and commercial property for sale in Lagos. MCBHLUES Enterprises handles the search, valuation, title checks and purchase from start to finish.",
  path: "/buy",
  socialDescription:
    "Verified homes, land and commercial property for sale in Lagos, with title checks and valuation handled for you.",
});

export default async function BuyPage() {
  const [properties, faqs] = await Promise.all([
    listPublishedProperties(),
    listPublishedFaqs("buying").catch(() => []),
  ]);

  return (
    <div className="flex flex-col">
      <BuyHero />
      <BuyProcess />
      <BuyListings properties={properties.map(toPublicProperty)} />
      <BuyFAQ items={faqs.map((row) => ({ question: row.question, answer: row.answer }))} />
      <CTASection />
    </div>
  );
}
