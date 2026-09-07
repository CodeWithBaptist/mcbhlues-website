/**
 * The default legal documents, in the `legal-format` markup. The public pages
 * render these until staff save an override in Portal → Legal Documents, and
 * the portal offers a reset that restores them verbatim.
 *
 * Keep the `[[PLACEHOLDERS]]`: they render highlighted so business details
 * that still need confirming can never silently ship as finished copy.
 */

export interface LegalDocDefaults {
  slug: "privacy" | "terms" | "cookies";
  label: string;
  title: string;
  summary: string;
  updated: string;
  body: string;
}

const PRIVACY_BODY = `## Who we are

MCBHLUES ENTERPRISES (“we”, “us”, “our”) is a real estate consulting, property development and facility management firm registered in Nigeria, with its registered office at 14 Akin Adesola Street, Victoria Island, Lagos, Nigeria.

Company registration number (RC): [[RC NUMBER]]. NDPC data controller registration number: [[NDPC REGISTRATION NUMBER, IF APPLICABLE]].

We are the **data controller** for the personal data described in this policy. Our Data Protection Officer can be reached at [[DPO EMAIL ADDRESS]].

## What personal data we collect

We only collect what we actually need. In practice that is:

- **Enquiry details** — the name, email address, phone number, subject and message you type into our contact form or a property enquiry form, plus the listing you enquired about.
- **Correspondence** — emails, call notes and messages exchanged with our consultants while we handle your enquiry.
- **Client and transaction records** — if you go on to instruct us, the identification, address, financial and property documents required to complete the transaction and to meet our anti-money-laundering obligations.
- **Technical data** — your IP address, browser type and the pages you visited. This is generated automatically by our servers and, where you have consented, by our analytics provider.
- **Saved properties** — the listings you mark as favourites are stored in your own browser (localStorage). They are never transmitted to us unless you send them in an enquiry.

We do not ask for, and please do not send us, sensitive personal data (health, religion, political opinions, biometric data) unless a transaction specifically requires it and we have told you so.

## Why we use it

- To reply to your enquiry and arrange viewings, valuations or consultations.
- To deliver the consulting, development or facility management services you engage us for.
- To keep the records we are legally required to keep, including tax and anti-money-laundering records.
- To keep this website secure — detecting and blocking spam, abuse and automated attacks.
- With your consent, to measure how the website is used so we can improve it.
- With your consent, to send you property alerts or updates. You can unsubscribe from any of these at any time.

We do **not** sell your personal data, and we do not use it for automated decision-making or profiling that produces legal effects for you.

## Our legal basis

Under the Nigeria Data Protection Act 2023 (NDPA) — and the UK/EU GDPR where it applies to you — we rely on:

- **Your consent** — for analytics cookies and marketing messages. You may withdraw it at any time.
- **Performance of a contract** — to provide the services you have engaged us for, or to take steps at your request before entering into a contract.
- **Legal obligation** — for tax, property, and anti-money-laundering record-keeping.
- **Legitimate interests** — to respond to enquiries, secure our website and defend legal claims, where those interests are not overridden by your rights.

## Cookies and analytics

This site keeps its use of cookies to a minimum: a few strictly necessary entries in your own browser, plus optional cookieless analytics that only load with your consent. Blocking optional cookies does not restrict any part of this website.

The full inventory — what is stored, why, and for how long — is in our [Cookie Policy](/cookies). You can change your mind at any time with the **“Cookie settings”** link in the footer of every page, or by clearing site data in your browser.

## Who we share it with

We share personal data only where it is necessary, and only with parties who are contractually bound to protect it:

- **Hosting and infrastructure** — Vercel Inc. (website hosting, analytics) and our database provider [[DATABASE PROVIDER, e.g. Neon]].
- **Email delivery** — [[EMAIL / SMTP PROVIDER]], used to send acknowledgements and correspondence.
- **Security** — Cloudflare, Inc., for bot protection on our forms.
- **Professional advisers** — solicitors, surveyors, valuers and accountants engaged on your transaction.
- **Authorities** — where we are required by Nigerian law, a court order or a regulator to disclose information.

Some of these providers process data outside Nigeria. Where that happens we rely on the transfer safeguards permitted by section 41 of the NDPA, including adequacy decisions and standard contractual clauses.

## How long we keep it

- Website enquiries that do not become clients: 24 months from your last contact with us.
- Client and transaction records: [[RETENTION PERIOD, e.g. 7 years]] after the engagement ends, to meet tax and anti-money-laundering requirements.
- Server and security logs: 90 days.
- Marketing consent records: for as long as the consent is active, plus 2 years as evidence that it was given.

When a retention period ends we delete the data or irreversibly anonymise it.

## How we protect it

- The whole site is served over HTTPS and enforces HSTS, so your data is encrypted in transit.
- Staff access to enquiry and client records is role-based, individually accounted for, and every change is written to an audit log.
- Passwords are stored only as salted hashes; we can never see them.
- Our forms are rate-limited and protected by a bot challenge.

No system is perfectly secure. If a breach ever affects your rights we will notify the Nigeria Data Protection Commission within 72 hours and tell you directly where the law requires it.

## Your rights

Under the NDPA you have the right to:

- Ask what personal data we hold about you, and get a copy of it.
- Have inaccurate or incomplete data corrected.
- Ask us to delete data we no longer have a lawful reason to keep.
- Object to, or ask us to restrict, certain processing.
- Receive the data you gave us in a portable, machine-readable format.
- Withdraw consent at any time, without affecting anything done before you withdrew it.
- Complain to the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.

To exercise any of these, email us at [info@mcbhlues.com](mailto:info@mcbhlues.com). We respond within 30 days and never charge for a first request.

## Children

This website is intended for adults. We do not knowingly collect personal data from anyone under 18. If you believe a child has given us their data, contact us and we will delete it.

## Changes to this policy

We review this policy at least once a year. When we make a material change we update the “last updated” date at the top and, where the change affects how we use data you have already given us, we will tell you directly.

## Contact us

- **MCBHLUES ENTERPRISES**, 14 Akin Adesola Street, Victoria Island, Lagos, Nigeria
- Email: [info@mcbhlues.com](mailto:info@mcbhlues.com)
- Phone: [+234 800 000 0000](tel:+2348000000000)

This policy is provided for information and is not legal advice. Please have it reviewed by a Nigerian-qualified lawyer, and replace every highlighted placeholder, before you rely on it.`;

const TERMS_BODY = `## Acceptance of these terms

By accessing or using **mcbhlues.com** you agree to be bound by these Terms & Conditions and by our [Privacy Policy](/privacy). If you do not agree with them, please do not use the site.

These terms govern your use of the *website*. Any engagement for consulting, development or facility management services is governed by a separate signed agreement, which takes precedence over these terms if the two conflict.

## Who we are

MCBHLUES ENTERPRISES is a real estate consulting, property development and facility management firm registered in Nigeria (RC [[RC NUMBER]]), with its registered office at 14 Akin Adesola Street, Victoria Island, Lagos, Nigeria.

Where these terms refer to “we”, “us” or “our”, they mean MCBHLUES ENTERPRISES. “You” means the person using this website.

## Using this website

You may browse, search and share our pages freely. You must not:

- Use the site for anything unlawful, fraudulent or misleading.
- Scrape, harvest or bulk-copy our listings, photographs or contact details, whether manually or with automated tools.
- Submit false, defamatory, abusive or spam content through any form on the site.
- Attempt to gain unauthorised access to the Staff Portal, our servers, database or any account that is not yours.
- Introduce malware, or interfere with the availability or integrity of the site.
- Frame, mirror or resell any part of the site without our written permission.

We may block access without notice if we reasonably believe any of the above is happening.

## Property listings

Listings are published in good faith and reviewed by our team, but they are provided **for general information only**. In particular:

- Prices, availability, dimensions, service charges and completion dates can change without notice, and a listing may be withdrawn at any time.
- Photographs, floor plans and computer-generated images are indicative. Furnishings shown are not necessarily included.
- Measurements are approximate and must not be relied on for ordering materials or for any other purpose requiring accuracy.
- Nothing on this site is an offer or a contract, nor part of one. No statement here should be relied upon as a representation of fact.

Before committing to any purchase, lease or investment you must carry out your own inspection, title verification, survey and legal due diligence, and take independent professional advice.

## Enquiries and viewings

When you submit an enquiry you confirm that the details you give are accurate and that you are entitled to use the email address and phone number provided. We will use them to respond to you as described in our Privacy Policy.

Submitting an enquiry does not reserve a property or create any obligation on either side. Viewings are by appointment and subject to confirmation, access and the owner’s agreement.

Our forms are protected by rate limiting and a bot challenge. If you genuinely cannot get a message through, please call or email us directly.

## Professional services

Consulting, development and facility management engagements begin only when both parties have signed a written agreement setting out the scope, deliverables, timeline and fees. Until then, discussions, proposals and estimates are non-binding.

We will perform our services with the reasonable skill and care expected of a competent professional in our field. Timelines that depend on third parties — regulators, utilities, contractors, land registries — are estimates, not guarantees.

## Fees and payments

- Fees, commissions and payment terms are set out in your engagement letter. Standard commission on a completed sale or letting is [[COMMISSION RATE]] unless agreed otherwise in writing.
- Invoices are payable within [[PAYMENT TERMS, e.g. 14 days]] of the invoice date.
- Overdue amounts may attract interest at [[LATE PAYMENT INTEREST RATE]] per month.
- All fees are exclusive of VAT, stamp duty, registration fees and other statutory charges unless expressly stated.
- We never request payment to a bank account other than the one printed on our invoice. Always verify account details with us by phone before transferring funds.

## Intellectual property

The MCBHLUES name and logo, the design of this website, and its text, photographs, graphics and code are owned by us or licensed to us and are protected by Nigerian and international copyright and trade mark law.

You may view, download and print pages for your own personal, non-commercial use. Any other reproduction, adaptation or commercial use requires our prior written consent.

## Third-party links and content

The site may link to third-party websites, embed a map, or rely on services such as Cloudflare and Vercel. We do not control those services and are not responsible for their content, availability or privacy practices. A link is not an endorsement.

## Limitation of liability

Nothing in these terms excludes or limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be excluded under Nigerian law.

Subject to that, and to the fullest extent permitted by law:

- The website is provided “as is” and “as available”. We do not warrant that it will be uninterrupted, error-free or free of harmful components.
- We are not liable for indirect or consequential loss, loss of profit, loss of business, loss of anticipated savings, or loss of data arising from your use of the website.
- We are not liable for any decision you take in reliance on information published on this website without independent verification.
- Our total liability arising out of or in connection with the website is limited to [[LIABILITY CAP, e.g. NGN 500,000]]. Liability arising from a signed services agreement is governed by the cap in that agreement.

## Indemnity

You agree to indemnify us against any claim, loss or cost (including reasonable legal fees) arising from your breach of these terms, your misuse of the website, or content you submit through it.

## Privacy and data protection

We handle personal data in accordance with the Nigeria Data Protection Act 2023 and our [Privacy Policy](/privacy), which forms part of these terms.

## Availability and suspension

We may change, suspend or withdraw all or part of the website at any time, including for maintenance, without notice and without liability. We aim to keep planned downtime short and outside business hours.

## Changes to these terms

We may update these terms from time to time. The version published on this page is the one that applies, and the “last updated” date at the top tells you when it changed. Continuing to use the site after a change means you accept the revised terms.

## Governing law and disputes

These terms are governed by the laws of the Federal Republic of Nigeria. The courts of Lagos State have exclusive jurisdiction over any dispute, although we ask that you contact us first so we can try to resolve it directly.

If any provision of these terms is found to be unenforceable, the remaining provisions continue in full force.

## Contact us

- **MCBHLUES ENTERPRISES**, 14 Akin Adesola Street, Victoria Island, Lagos, Nigeria
- Email: [info@mcbhlues.com](mailto:info@mcbhlues.com)
- Phone: [+234 800 000 0000](tel:+2348000000000)

These terms are provided for information and are not legal advice. Please have them reviewed by a Nigerian-qualified lawyer, and replace every highlighted placeholder, before you rely on them.`;

const COOKIES_BODY = `## What we store

A cookie is a small file a website stores on your device. This site keeps its use of them to a minimum, and you are asked before anything optional is loaded.

## Cookie inventory

| Name | Type | Purpose | Retention |
| ---- | ---- | ------- | --------- |
| \`mcbhlues-cookie-consent\` | Essential (localStorage) | Remembers your cookie choice so we stop asking. | Until you clear it |
| \`mcbhlues-public-theme\` | Essential (localStorage) | Remembers your light/dark display preference. | Until you clear it |
| \`mcbhlues-favorites\` | Essential (localStorage) | Stores the listings you saved, in your browser only. | Until you clear it |
| \`mcbhlues_staff_session\` | Essential (cookie) | Signs staff in to the private portal. Never set for public visitors. | Session |
| \`Vercel Web Analytics\` | Optional — consent required | Cookieless, aggregated page-view counts. No cross-site tracking, no advertising profile. | Aggregated |
| \`Vercel Speed Insights\` | Essential (performance) | Anonymous page-speed measurements. Sets no cookie and stores no identifier. | Aggregated |
| \`Cloudflare Turnstile\` | Essential (security) | Confirms a form was submitted by a person, not a bot. Cloudflare states it does not use the data for advertising. | Minutes |

## Managing your choice

You can change your mind at any time using the **“Cookie settings”** link in the footer of every page, or by clearing site data in your browser. Blocking optional cookies does not restrict any part of this website.

For how we handle the personal data behind these technologies, see our [Privacy Policy](/privacy).`;

export const DEFAULT_LEGAL_DOCS: LegalDocDefaults[] = [
  {
    slug: "privacy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    summary:
      "This policy explains what personal data MCBHLUES Enterprises collects when you use this website or engage our services, why we collect it, how long we keep it and what you can ask us to do with it.",
    updated: "2026-09-07",
    body: PRIVACY_BODY,
  },
  {
    slug: "terms",
    label: "Terms & Conditions",
    title: "Terms & Conditions",
    summary:
      "These terms set out the rules for using this website and the basis on which MCBHLUES Enterprises provides information, property listings and professional services. Please read them before using the site.",
    updated: "2026-09-07",
    body: TERMS_BODY,
  },
  {
    slug: "cookies",
    label: "Cookie Policy",
    title: "Cookie Policy",
    summary:
      "What this website stores on your device, why, and how to change your mind. Essential storage only, unless you opt in to anonymous analytics.",
    updated: "2026-09-07",
    body: COOKIES_BODY,
  },
];
