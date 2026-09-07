import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { getLegalDoc } from "@/lib/legal/legal-docs";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60; // seconds — keep in sync with docs (see src/lib/cache.ts)

export const metadata: Metadata = pageMetadata({
  title: "Cookie Policy",
  description:
    "What the MCBHLUES Enterprises website stores on your device, why, and how to change your mind. Essential storage only, unless you opt in to anonymous analytics.",
  path: "/cookies",
  type: "article",
  socialDescription:
    "What this website stores on your device, why, and how to change your mind.",
});

/** Text is staff-editable in Portal → Legal Documents; this page just renders it. */
export default async function CookiePolicyPage() {
  const doc = await getLegalDoc("cookies");
  return <LegalDocument doc={doc} />;
}
