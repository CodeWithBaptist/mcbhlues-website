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
  title: "Privacy Policy",
  description:
    "How MCBHLUES Enterprises collects, uses, stores and protects your personal data, your rights under the Nigeria Data Protection Act 2023, and the cookies this website uses.",
  path: "/privacy",
  type: "article",
  socialDescription:
    "How we collect, use and protect your personal data, and the cookies this website uses.",
});

const TOC = [
  { id: "who-we-are", title: "Who we are" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "why-we-use-it", title: "Why we use it" },
  { id: "legal-basis", title: "Legal basis" },
  { id: "cookies", title: "Cookies & analytics" },
  { id: "sharing", title: "Who we share with" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "How we protect it" },
  { id: "your-rights", title: "Your rights" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact us" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col">
      <LegalHero
        eyebrow="Legal"
        title="Privacy Policy"
        summary="This policy explains what personal data MCBHLUES Enterprises collects when you use this website or engage our services, why we collect it, how long we keep it and what you can ask us to do with it."
        lastUpdated={LAST_UPDATED}
      />

      <LegalLayout toc={TOC}>
        <LegalSection id="who-we-are" title="1. Who we are">
          <p>
            {SITE_CONFIG.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a real
            estate consulting, property development and facility management firm
            registered in Nigeria, with its registered office at{" "}
            {SITE_CONFIG.contact.address}.
          </p>
          <p>
            Company registration number (RC):{" "}
            <Placeholder>RC NUMBER</Placeholder>. NDPC data controller
            registration number: <Placeholder>NDPC REGISTRATION NUMBER, IF APPLICABLE</Placeholder>.
          </p>
          <p>
            We are the <strong>data controller</strong> for the personal data
            described in this policy. Our Data Protection Officer can be reached
            at <Placeholder>DPO EMAIL ADDRESS</Placeholder>.
          </p>
        </LegalSection>

        <LegalSection id="what-we-collect" title="2. What personal data we collect">
          <p>We only collect what we actually need. In practice that is:</p>
          <LegalList
            items={[
              <>
                <strong>Enquiry details</strong> — the name, email address, phone
                number, subject and message you type into our contact form or a
                property enquiry form, plus the listing you enquired about.
              </>,
              <>
                <strong>Correspondence</strong> — emails, call notes and messages
                exchanged with our consultants while we handle your enquiry.
              </>,
              <>
                <strong>Client and transaction records</strong> — if you go on to
                instruct us, the identification, address, financial and property
                documents required to complete the transaction and to meet our
                anti-money-laundering obligations.
              </>,
              <>
                <strong>Technical data</strong> — your IP address, browser type
                and the pages you visited. This is generated automatically by our
                servers and, where you have consented, by our analytics provider.
              </>,
              <>
                <strong>Saved properties</strong> — the listings you mark as
                favourites are stored in your own browser (localStorage). They
                are never transmitted to us unless you send them in an enquiry.
              </>,
            ]}
          />
          <p>
            We do not ask for, and please do not send us, sensitive personal data
            (health, religion, political opinions, biometric data) unless a
            transaction specifically requires it and we have told you so.
          </p>
        </LegalSection>

        <LegalSection id="why-we-use-it" title="3. Why we use it">
          <LegalList
            items={[
              "To reply to your enquiry and arrange viewings, valuations or consultations.",
              "To deliver the consulting, development or facility management services you engage us for.",
              "To keep the records we are legally required to keep, including tax and anti-money-laundering records.",
              "To keep this website secure — detecting and blocking spam, abuse and automated attacks.",
              "With your consent, to measure how the website is used so we can improve it.",
              "With your consent, to send you property alerts or updates. You can unsubscribe from any of these at any time.",
            ]}
          />
          <p>
            We do <strong>not</strong> sell your personal data, and we do not use
            it for automated decision-making or profiling that produces legal
            effects for you.
          </p>
        </LegalSection>

        <LegalSection id="legal-basis" title="4. Our legal basis">
          <p>
            Under the Nigeria Data Protection Act 2023 (NDPA) — and the UK/EU
            GDPR where it applies to you — we rely on:
          </p>
          <LegalList
            items={[
              <>
                <strong>Your consent</strong> — for analytics cookies and
                marketing messages. You may withdraw it at any time.
              </>,
              <>
                <strong>Performance of a contract</strong> — to provide the
                services you have engaged us for, or to take steps at your
                request before entering into a contract.
              </>,
              <>
                <strong>Legal obligation</strong> — for tax, property, and
                anti-money-laundering record-keeping.
              </>,
              <>
                <strong>Legitimate interests</strong> — to respond to enquiries,
                secure our website and defend legal claims, where those interests
                are not overridden by your rights.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection id="cookies" title="5. Cookies and analytics">
          <p>
            A cookie is a small file a website stores on your device. This site
            keeps its use of them to a minimum, and you are asked before anything
            optional is loaded.
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Cookies and similar technologies used on mcbhlues.com
              </caption>
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Name</th>
                  <th scope="col" className="px-4 py-3 font-bold">Type</th>
                  <th scope="col" className="px-4 py-3 font-bold">Purpose</th>
                  <th scope="col" className="px-4 py-3 font-bold">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">mcbhlues-cookie-consent</td>
                  <td className="px-4 py-3">Essential (localStorage)</td>
                  <td className="px-4 py-3">Remembers your cookie choice so we stop asking.</td>
                  <td className="px-4 py-3">Until you clear it</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">mcbhlues-public-theme</td>
                  <td className="px-4 py-3">Essential (localStorage)</td>
                  <td className="px-4 py-3">Remembers your light/dark display preference.</td>
                  <td className="px-4 py-3">Until you clear it</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">mcbhlues-favorites</td>
                  <td className="px-4 py-3">Essential (localStorage)</td>
                  <td className="px-4 py-3">Stores the listings you saved, in your browser only.</td>
                  <td className="px-4 py-3">Until you clear it</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">mcbhlues_staff_session</td>
                  <td className="px-4 py-3">Essential (cookie)</td>
                  <td className="px-4 py-3">
                    Signs staff in to the private portal. Never set for public visitors.
                  </td>
                  <td className="px-4 py-3">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">Vercel Web Analytics</td>
                  <td className="px-4 py-3">Optional — consent required</td>
                  <td className="px-4 py-3">
                    Cookieless, aggregated page-view counts. No cross-site tracking,
                    no advertising profile.
                  </td>
                  <td className="px-4 py-3">Aggregated</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">Vercel Speed Insights</td>
                  <td className="px-4 py-3">Essential (performance)</td>
                  <td className="px-4 py-3">
                    Anonymous page-speed measurements. Sets no cookie and stores no identifier.
                  </td>
                  <td className="px-4 py-3">Aggregated</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">Cloudflare Turnstile</td>
                  <td className="px-4 py-3">Essential (security)</td>
                  <td className="px-4 py-3">
                    Confirms a form was submitted by a person, not a bot. Cloudflare
                    states it does not use the data for advertising.
                  </td>
                  <td className="px-4 py-3">Minutes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            You can change your mind at any time using the{" "}
            <strong>&ldquo;Cookie settings&rdquo;</strong> link in the footer of
            every page, or by clearing site data in your browser. Blocking
            optional cookies does not restrict any part of this website.
          </p>
        </LegalSection>

        <LegalSection id="sharing" title="6. Who we share it with">
          <p>
            We share personal data only where it is necessary, and only with
            parties who are contractually bound to protect it:
          </p>
          <LegalList
            items={[
              <>
                <strong>Hosting and infrastructure</strong> — Vercel Inc. (website
                hosting, analytics) and our database provider{" "}
                <Placeholder>DATABASE PROVIDER, e.g. Neon</Placeholder>.
              </>,
              <>
                <strong>Email delivery</strong> —{" "}
                <Placeholder>EMAIL / SMTP PROVIDER</Placeholder>, used to send
                acknowledgements and correspondence.
              </>,
              <>
                <strong>Security</strong> — Cloudflare, Inc., for bot protection
                on our forms.
              </>,
              <>
                <strong>Professional advisers</strong> — solicitors, surveyors,
                valuers and accountants engaged on your transaction.
              </>,
              <>
                <strong>Authorities</strong> — where we are required by Nigerian
                law, a court order or a regulator to disclose information.
              </>,
            ]}
          />
          <p>
            Some of these providers process data outside Nigeria. Where that
            happens we rely on the transfer safeguards permitted by section 41 of
            the NDPA, including adequacy decisions and standard contractual
            clauses.
          </p>
        </LegalSection>

        <LegalSection id="retention" title="7. How long we keep it">
          <LegalList
            items={[
              "Website enquiries that do not become clients: 24 months from your last contact with us.",
              <>
                Client and transaction records:{" "}
                <Placeholder>RETENTION PERIOD, e.g. 7 years</Placeholder> after the
                engagement ends, to meet tax and anti-money-laundering
                requirements.
              </>,
              "Server and security logs: 90 days.",
              "Marketing consent records: for as long as the consent is active, plus 2 years as evidence that it was given.",
            ]}
          />
          <p>
            When a retention period ends we delete the data or irreversibly
            anonymise it.
          </p>
        </LegalSection>

        <LegalSection id="security" title="8. How we protect it">
          <LegalList
            items={[
              "The whole site is served over HTTPS and enforces HSTS, so your data is encrypted in transit.",
              "Staff access to enquiry and client records is role-based, individually accounted for, and every change is written to an audit log.",
              "Passwords are stored only as salted hashes; we can never see them.",
              "Our forms are rate-limited and protected by a bot challenge.",
            ]}
          />
          <p>
            No system is perfectly secure. If a breach ever affects your rights
            we will notify the Nigeria Data Protection Commission within 72 hours
            and tell you directly where the law requires it.
          </p>
        </LegalSection>

        <LegalSection id="your-rights" title="9. Your rights">
          <p>Under the NDPA you have the right to:</p>
          <LegalList
            items={[
              "Ask what personal data we hold about you, and get a copy of it.",
              "Have inaccurate or incomplete data corrected.",
              "Ask us to delete data we no longer have a lawful reason to keep.",
              "Object to, or ask us to restrict, certain processing.",
              "Receive the data you gave us in a portable, machine-readable format.",
              "Withdraw consent at any time, without affecting anything done before you withdrew it.",
              "Complain to the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.",
            ]}
          />
          <p>
            To exercise any of these, email us at{" "}
            <a
              href={`mailto:${SITE_CONFIG.contact.email}`}
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {SITE_CONFIG.contact.email}
            </a>
            . We respond within 30 days and never charge for a first request.
          </p>
        </LegalSection>

        <LegalSection id="children" title="10. Children">
          <p>
            This website is intended for adults. We do not knowingly collect
            personal data from anyone under 18. If you believe a child has given
            us their data, contact us and we will delete it.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="11. Changes to this policy">
          <p>
            We review this policy at least once a year. When we make a material
            change we update the &ldquo;last updated&rdquo; date at the top and,
            where the change affects how we use data you have already given us,
            we will tell you directly.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="12. Contact us">
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
            This policy is provided for information and is not legal advice.
            Please have it reviewed by a Nigerian-qualified lawyer, and replace
            every highlighted placeholder, before you rely on it.
          </p>
        </LegalSection>

        <LegalFooterNote />
      </LegalLayout>
    </div>
  );
}
