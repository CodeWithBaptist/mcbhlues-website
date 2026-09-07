import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { getLegalDoc } from "@/lib/legal/legal-docs";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of the MCBHLUES Enterprises website, our property listings, enquiry forms and professional services in Lagos, Nigeria.",
  path: "/terms",
  type: "article",
  socialDescription:
    "The terms governing your use of the MCBHLUES Enterprises website and services.",
});

/** Text is staff-editable in Portal → Legal Documents; this page just renders it. */
export default async function TermsPage() {
  const doc = await getLegalDoc("terms");
  return <LegalDocument doc={doc} />;
}
