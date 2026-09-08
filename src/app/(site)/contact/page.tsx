import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactHero } from "@/components/sections/contact/contact-hero";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { ContactInfo } from "@/components/sections/contact/contact-info";
import { getCompanyInfo } from "@/lib/settings/company";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

export const metadata: Metadata = pageMetadata({
  title: "Contact Us — Book a Free Consultation",
  description:
    "Talk to a MCBHLUES Enterprises consultant in Lagos about buying, renting, developing or managing property. Send a message and we will reply with the next steps and the cost.",
  path: "/contact",
  socialTitle: "Contact MCBHLUES Enterprises — Book a Free Consultation",
  socialDescription:
    "Tell us what you are planning. A consultant replies with the next steps, what is involved and what it costs.",
});

export default async function ContactPage() {
  const company = await getCompanyInfo();

  return (
    <div className="flex flex-col bg-gray-50/60">
      <ContactHero />

      <Container className="py-16 sm:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <ContactInfo
              contact={{ email: company.email, phone: company.phone, address: company.address }}
            />
          </div>
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
