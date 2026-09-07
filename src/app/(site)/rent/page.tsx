import { Metadata } from "next";
import { RentHero } from "@/components/sections/rent/rent-hero";
import { RentPerks } from "@/components/sections/rent/rent-perks";
import { RentListings } from "@/components/sections/rent/rent-listings";
import { RentProcess } from "@/components/sections/rent/rent-process";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";
import { getCmsValues } from "@/lib/cms/cms-service";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Property to Rent in Lagos",
  description:
    "Residential and commercial property to rent in Lagos. Check the monthly rent and the terms, arrange a viewing, and have every lease reviewed by our team before you sign.",
  path: "/rent",
  socialDescription:
    "Vetted homes and workspace to rent in Lagos, with flexible terms and every lease reviewed before you sign.",
});

export default async function RentPage() {
  const [published, cms] = await Promise.all([
    listPublishedProperties(),
    getCmsValues().catch(() => ({} as Record<string, string>)),
  ]);
  const properties = published.map(toPublicProperty);

  return (
    <div className="flex flex-col">
      <RentHero
        content={{
          image: cms["rent.hero_image"] ?? "",
          imageAlt: cms["rent.hero_image_alt"] ?? "",
        }}
      />
      <RentPerks />
      <RentListings properties={properties} />
      <RentProcess />
      <CTASection />
    </div>
  );
}
