import { Metadata } from "next";
import { BuyHero } from "@/components/sections/buy/buy-hero";
import { BuyProcess } from "@/components/sections/buy/buy-process";
import { BuyListings } from "@/components/sections/buy/buy-listings";
import { BuyFAQ } from "@/components/sections/buy/buy-faq";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { listPublishedFaqs } from "@/lib/cms/cms-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buy",
  description:
    "Explore premium luxury properties for sale. Find your dream home or investment property with MCBHLUES ENTERPRISES.",
};

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
