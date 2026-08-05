import { Metadata } from "next";
import { RentHero } from "@/components/sections/rent/rent-hero";
import { RentPerks } from "@/components/sections/rent/rent-perks";
import { RentListings } from "@/components/sections/rent/rent-listings";
import { RentProcess } from "@/components/sections/rent/rent-process";
import { CTASection } from "@/components/sections/home/cta-section";

export const metadata: Metadata = {
  title: "Rent",
  description: "Luxury properties for rent. Find high-end residential and commercial rentals with MCBHLUES ENTERPRISES.",
};

export default function RentPage() {
  return (
    <div className="flex flex-col">
      <RentHero />
      <RentPerks />
      <RentListings />
      <RentProcess />
      <CTASection />
    </div>
  );
}
