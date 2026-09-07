import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { getLegalDoc } from "@/lib/legal/legal-docs";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How MCBHLUES Enterprises collects, uses, stores and protects your personal data, your rights under the Nigeria Data Protection Act 2023, and the cookies this website uses.",
  path: "/privacy",
  type: "article",
  socialDescription:
    "How we collect, use and protect your personal data, and the cookies this website uses.",
});

/** Text is staff-editable in Portal → Legal Documents; this page just renders it. */
export default async function PrivacyPolicyPage() {
  const doc = await getLegalDoc("privacy");
  return <LegalDocument doc={doc} />;
}
