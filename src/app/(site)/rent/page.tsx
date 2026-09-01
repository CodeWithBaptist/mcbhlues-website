import { Metadata } from "next";
import { RentHero } from "@/components/sections/rent/rent-hero";
import { RentPerks } from "@/components/sections/rent/rent-perks";
import { RentListings } from "@/components/sections/rent/rent-listings";
import { RentProcess } from "@/components/sections/rent/rent-process";
import { CTASection } from "@/components/sections/home/cta-section";
import { listPublishedProperties } from "@/lib/properties/property-service";
import { toPublicProperty } from "@/lib/properties/public-property";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rent",
  description: "Luxury properties for rent. Find high-end residential and commercial rentals with MCBHLUES ENTERPRISES.",
};

export default async function RentPage() {
  const properties = (await listPublishedProperties()).map(toPublicProperty);

  return (
    <div className="flex flex-col">
      <RentHero />
      <RentPerks />
      <RentListings properties={properties} />
      <RentProcess />
      <CTASection />
    </div>
  );
}
