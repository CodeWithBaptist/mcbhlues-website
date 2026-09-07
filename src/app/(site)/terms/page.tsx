import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/constants";
import {
  LegalFooterNote,
  LegalHero,
  LegalLayout,
  LegalList,
  LegalSection,
  Placeholder,
} from "@/components/sections/legal/legal-page";
import { pageMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-09-07";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of the MCBHLUES Enterprises website, our property listings, enquiry forms and professional services in Lagos, Nigeria.",
  path: "/terms",
  type: "article",
  socialDescription:
    "The terms governing your use of the MCBHLUES Enterprises website and services.",
});

const TOC = [
  { id: "acceptance", title: "Acceptance" },
  { id: "who-we-are", title: "Who we are" },
  { id: "using-the-site", title: "Using this website" },
  { id: "listings", title: "Property listings" },
  { id: "enquiries", title: "Enquiries & viewings" },
  { id: "services", title: "Professional services" },
  { id: "fees", title: "Fees & payments" },
  { id: "intellectual-property", title: "Intellectual property" },
  { id: "third-party", title: "Third-party links" },
  { id: "liability", title: "Liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "privacy", title: "Privacy" },
  { id: "suspension", title: "Suspension" },
  { id: "changes", title: "Changes to these terms" },
  { id: "law", title: "Governing law" },
  { id: "contact", title: "Contact us" },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <LegalHero
        eyebrow="Legal"
        title="Terms & Conditions"
        summary="These terms set out the rules for using this website and the basis on which MCBHLUES Enterprises provides information, property listings and professional services. Please read them before using the site."
        lastUpdated={LAST_UPDATED}
      />

      <LegalLayout toc={TOC}>
        <LegalSection id="acceptance" title="1. Acceptance of these terms">
          <p>
            By accessing or using{" "}
            <span className="font-semibold">{SITE_CONFIG.url.replace(/^https?:\/\//, "")}</span>{" "}
            you agree to be bound by these Terms &amp; Conditions and by our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              Privacy Policy
            </Link>
            . If you do not agree with them, please do not use the site.
          </p>
          <p>
            These terms govern your use of the <em>website</em>. Any engagement
            for consulting, development or facility management services is
            governed by a separate signed agreement, which takes precedence over
            these terms if the two conflict.
          </p>
        </LegalSection>

        <LegalSection id="who-we-are" title="2. Who we are">
          <p>
            {SITE_CONFIG.name} is a real estate consulting, property development
            and facility management firm registered in Nigeria (RC{" "}
            <Placeholder>RC NUMBER</Placeholder>), with its registered office at{" "}
            {SITE_CONFIG.contact.address}.
          </p>
          <p>
            Where these terms refer to &ldquo;we&rdquo;, &ldquo;us&rdquo; or
            &ldquo;our&rdquo;, they mean {SITE_CONFIG.name}.
            &ldquo;You&rdquo; means the person using this website.
          </p>
        </LegalSection>

        <LegalSection id="using-the-site" title="3. Using this website">
          <p>You may browse, search and share our pages freely. You must not:</p>
          <LegalList
            items={[
              "Use the site for anything unlawful, fraudulent or misleading.",
              "Scrape, harvest or bulk-copy our listings, photographs or contact details, whether manually or with automated tools.",
              "Submit false, defamatory, abusive or spam content through any form on the site.",
              "Attempt to gain unauthorised access to the Staff Portal, our servers, database or any account that is not yours.",
              "Introduce malware, or interfere with the availability or integrity of the site.",
              "Frame, mirror or resell any part of the site without our written permission.",
            ]}
          />
          <p>
            We may block access without notice if we reasonably believe any of
            the above is happening.
          </p>
        </LegalSection>

        <LegalSection id="listings" title="4. Property listings">
          <p>
            Listings are published in good faith and reviewed by our team, but
            they are provided <strong>for general information only</strong>. In
            particular:
          </p>
          <LegalList
            items={[
              "Prices, availability, dimensions, service charges and completion dates can change without notice, and a listing may be withdrawn at any time.",
              "Photographs, floor plans and computer-generated images are indicative. Furnishings shown are not necessarily included.",
              "Measurements are approximate and must not be relied on for ordering materials or for any other purpose requiring accuracy.",
              "Nothing on this site is an offer or a contract, nor part of one. No statement here should be relied upon as a representation of fact.",
            ]}
          />
          <p>
            Before committing to any purchase, lease or investment you must carry
            out your own inspection, title verification, survey and legal due
            diligence, and take independent professional advice.
          </p>
        </LegalSection>

        <LegalSection id="enquiries" title="5. Enquiries and viewings">
          <p>
            When you submit an enquiry you confirm that the details you give are
            accurate and that you are entitled to use the email address and phone
            number provided. We will use them to respond to you as described in
            our Privacy Policy.
          </p>
          <p>
            Submitting an enquiry does not reserve a property or create any
            obligation on either side. Viewings are by appointment and subject to
            confirmation, access and the owner&rsquo;s agreement.
          </p>
          <p>
            Our forms are protected by rate limiting and a bot challenge. If you
            genuinely cannot get a message through, please call or email us
            directly.
          </p>
        </LegalSection>

        <LegalSection id="services" title="6. Professional services">
          <p>
            Consulting, development and facility management engagements begin
            only when both parties have signed a written agreement setting out
            the scope, deliverables, timeline and fees. Until then, discussions,
            proposals and estimates are non-binding.
          </p>
          <p>
            We will perform our services with the reasonable skill and care
            expected of a competent professional in our field. Timelines that
            depend on third parties — regulators, utilities, contractors, land
            registries — are estimates, not guarantees.
          </p>
        </LegalSection>

        <LegalSection id="fees" title="7. Fees and payments">
          <LegalList
            items={[
              <>
                Fees, commissions and payment terms are set out in your
                engagement letter. Standard commission on a completed sale or
                letting is <Placeholder>COMMISSION RATE</Placeholder> unless
                agreed otherwise in writing.
              </>,
              <>
                Invoices are payable within{" "}
                <Placeholder>PAYMENT TERMS, e.g. 14 days</Placeholder> of the
                invoice date.
              </>,
              <>
                Overdue amounts may attract interest at{" "}
                <Placeholder>LATE PAYMENT INTEREST RATE</Placeholder> per month.
              </>,
              "All fees are exclusive of VAT, stamp duty, registration fees and other statutory charges unless expressly stated.",
              "We never request payment to a bank account other than the one printed on our invoice. Always verify account details with us by phone before transferring funds.",
            ]}
          />
        </LegalSection>

        <LegalSection id="intellectual-property" title="8. Intellectual property">
          <p>
            The MCBHLUES name and logo, the design of this website, and its text,
            photographs, graphics and code are owned by us or licensed to us and
            are protected by Nigerian and international copyright and trade mark
            law.
          </p>
          <p>
            You may view, download and print pages for your own personal,
            non-commercial use. Any other reproduction, adaptation or commercial
            use requires our prior written consent.
          </p>
        </LegalSection>

        <LegalSection id="third-party" title="9. Third-party links and content">
          <p>
            The site may link to third-party websites, embed a map, or rely on
            services such as Cloudflare and Vercel. We do not control those
            services and are not responsible for their content, availability or
            privacy practices. A link is not an endorsement.
          </p>
        </LegalSection>

        <LegalSection id="liability" title="10. Limitation of liability">
          <p>
            Nothing in these terms excludes or limits our liability for death or
            personal injury caused by our negligence, for fraud or fraudulent
            misrepresentation, or for anything else that cannot lawfully be
            excluded under Nigerian law.
          </p>
          <p>Subject to that, and to the fullest extent permitted by law:</p>
          <LegalList
            items={[
              "The website is provided “as is” and “as available”. We do not warrant that it will be uninterrupted, error-free or free of harmful components.",
              "We are not liable for indirect or consequential loss, loss of profit, loss of business, loss of anticipated savings, or loss of data arising from your use of the website.",
              "We are not liable for any decision you take in reliance on information published on this website without independent verification.",
              <>
                Our total liability arising out of or in connection with the
                website is limited to{" "}
                <Placeholder>LIABILITY CAP, e.g. NGN 500,000</Placeholder>.
                Liability arising from a signed services agreement is governed by
                the cap in that agreement.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection id="indemnity" title="11. Indemnity">
          <p>
            You agree to indemnify us against any claim, loss or cost (including
            reasonable legal fees) arising from your breach of these terms, your
            misuse of the website, or content you submit through it.
          </p>
        </LegalSection>

        <LegalSection id="privacy" title="12. Privacy and data protection">
          <p>
            We handle personal data in accordance with the Nigeria Data
            Protection Act 2023 and our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              Privacy Policy
            </Link>
            , which forms part of these terms.
          </p>
        </LegalSection>

        <LegalSection id="suspension" title="13. Availability and suspension">
          <p>
            We may change, suspend or withdraw all or part of the website at any
            time, including for maintenance, without notice and without
            liability. We aim to keep planned downtime short and outside business
            hours.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="14. Changes to these terms">
          <p>
            We may update these terms from time to time. The version published on
            this page is the one that applies, and the &ldquo;last updated&rdquo;
            date at the top tells you when it changed. Continuing to use the site
            after a change means you accept the revised terms.
          </p>
        </LegalSection>

        <LegalSection id="law" title="15. Governing law and disputes">
          <p>
            These terms are governed by the laws of the Federal Republic of
            Nigeria. The courts of Lagos State have exclusive jurisdiction over
            any dispute, although we ask that you contact us first so we can try
            to resolve it directly.
          </p>
          <p>
            If any provision of these terms is found to be unenforceable, the
            remaining provisions continue in full force.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="16. Contact us">
          <p>
            <strong>{SITE_CONFIG.name}</strong>
            <br />
            {SITE_CONFIG.contact.address}
            <br />
            Email:{" "}
            <a
              href={`mailto:${SITE_CONFIG.contact.email}`}
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {SITE_CONFIG.contact.email}
            </a>
            <br />
            Phone:{" "}
            <a
              href={`tel:${SITE_CONFIG.contact.phone.replace(/\s+/g, "")}`}
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {SITE_CONFIG.contact.phone}
            </a>
          </p>
          <p className="text-sm text-gray-600">
            These terms are provided for information and are not legal advice.
            Please have them reviewed by a Nigerian-qualified lawyer, and replace
            every highlighted placeholder, before you rely on them.
          </p>
        </LegalSection>

        <LegalFooterNote />
      </LegalLayout>
    </div>
  );
}
