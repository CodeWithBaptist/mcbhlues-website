import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactHero } from "@/components/sections/contact/contact-hero";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { ContactInfo } from "@/components/sections/contact/contact-info";
import { getCompanyInfo } from "@/lib/settings/company";
import { pageMetadata } from "@/lib/seo";

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
