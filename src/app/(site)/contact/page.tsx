import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactHero } from "@/components/sections/contact/contact-hero";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { ContactInfo } from "@/components/sections/contact/contact-info";
import { getCompanyInfo } from "@/lib/settings/company";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with MCBHLUES ENTERPRISES for all your real estate needs. Talk to a consultant or list your property today.",
};

export default async function ContactPage() {
  const company = await getCompanyInfo();

  return (
    <div className="flex flex-col bg-gray-50/30">
      <ContactHero />

      <Container className="py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <ContactInfo
            contact={{ email: company.email, phone: company.phone, address: company.address }}
          />
          <ContactForm />
        </div>
      </Container>
    </div>
  );
}
