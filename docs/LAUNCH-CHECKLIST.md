# Launch checklist

Every item you asked for, what was actually built, how it was verified, and the
short list of things only you can finish (domain, keys, legal details).

Legend: **Done** = shipped and verified in this repo · **You** = needs an action
in a dashboard or a decision from MCBHLUES.

---

## 1. Privacy policy page — Done

`/privacy` — a full draft written against the **Nigeria Data Protection Act
2023**: who we are, what we collect, why, legal basis, a cookie table, who we
share with, retention, security, your rights, children, changes, contact.

- Table of contents with in-page anchors; `/privacy#cookies` is linked from the
  footer as "Cookie Policy" and from the cookie banner.
- Server-rendered — a page of text ships no JavaScript of its own.
- **You:** replace the 11 highlighted placeholders (see §19 below).

## 2. Terms & conditions page — Done

`/terms` — services and scope, listings and property information, viewings,
fees and payment, client obligations, intellectual property, liability,
indemnity, termination, governing law, changes, contact.

- **You:** same placeholder pass — payment terms, late-payment interest,
  commission rate, liability cap.

## 3. Force HTTPS — Done

Three layers, so there is no plaintext window:

| Layer | Where |
| --- | --- |
| Edge redirect | Vercel, automatic once the domain is added |
| Application redirect | `src/proxy.ts` — 308 on `x-forwarded-proto: http`, production only |
| Browser enforcement | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on every production response |

Verified: `curl -sI` against the production build returns the HSTS header plus
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`X-Frame-Options` and no `X-Powered-By`.

- **You:** add the domain in Vercel (docs/DEPLOYMENT.md §7). Optionally submit
  to <https://hstspreload.org/> once you are sure every subdomain stays HTTPS.

## 4. Cookie consent banner — Done

`src/components/layout/cookie-consent.tsx`.

- **Nothing non-essential loads before you choose.** Vercel Analytics is
  mounted only after "Accept"; Speed Insights (no cookies, no personal data)
  always runs.
- Accept / Reject are given equal visual weight — required for valid consent.
- The choice lives in `localStorage`, not a cookie (a consent cookie would be
  self-defeating), is versioned so you can re-ask when categories change, and
  syncs across tabs.
- Built on `useSyncExternalStore`, so there is no flash of the banner on repeat
  visits and no hydration mismatch. Covered by unit tests
  (`tests/browser-stores.test.ts`).
- Verified: the banner markup is **absent** from the server HTML, so crawlers
  and Lighthouse never see it.

## 5. Meta titles + descriptions — Done

Every public page goes through one helper, `pageMetadata()` in `src/lib/seo.ts`:

- a short page title feeding the `%s | MCBHLUES ENTERPRISES` template;
- a 150–160 character, benefit-led description that names Lagos;
- a canonical URL;
- a complete Open Graph block **and** a matching Twitter card.

> The helper exists because Next.js **replaces** the parent `openGraph` object
> when a child route declares one — it does not merge. Hand-written `openGraph`
> blocks were silently dropping `og:image`, `og:type`, `og:site_name` and
> `og:locale` from every page. Always add new pages through `pageMetadata()`.

Property pages build their own from the listing (title, clamped description,
the listing photo) and also emit schema.org JSON-LD
(`SingleFamilyResidence` / `Apartment` with price, beds, baths, floor size,
address and offer availability). `/favorites` is `noindex, follow`.

## 6. Social preview image — Done

`public/og-image.jpg`, 1200×630, 109 KB, branded, with descriptive `alt` text.
Referenced by every page that does not have a better image of its own; property
pages use the listing photo instead. Served with a 7-day CDN cache.

- **You:** after go-live, run one page through Facebook's
  [Sharing Debugger](https://developers.facebook.com/tools/debug/) and press
  *Scrape Again* to warm the cache.

## 7. Sitemap + robots.txt — Done

- `/sitemap.xml` — the 8 public pages plus every published listing, with real
  `lastModified` dates from the database, sensible `changeFrequency` and
  priorities. Regenerates hourly. A database error yields a shorter sitemap,
  never a 500.
- `/robots.txt` — allows the public site, disallows `/portal`, `/admin`,
  `/api/` and `/favorites`, and points at the sitemap.
- **You:** submit the sitemap in Google Search Console.

## 8. Alt text on images — Done

- Every `<img>` on every public page has an `alt` attribute — verified by
  scraping the rendered HTML of all 11 routes (0 missing).
- Listing photos get *descriptive* alt text, not filenames:
  *"Azure Sky Penthouse — 3 bedroom property for sale in Victoria Island"*.
- Purely decorative images use `alt=""` plus `aria-hidden`, so screen readers
  skip them instead of announcing noise. Gallery thumbnails use `alt=""` with
  an off-screen label on the control.
- Listings with no photo render an icon plus a screen-reader-only
  "No photo available for …".

## 9. Compress images — Done

Two layers:

**At upload** (`src/lib/media/image-compression.ts`) — staff photos are
auto-rotated by EXIF, capped at 2400 px and re-encoded to WebP. Measured:

| Uploaded file | Before | After | Saved |
| --- | --- | --- | --- |
| Phone photo 4032×3024 | 3 570 KB | 226 KB | **93.7 %** |
| DSLR 3000×2000 | 1 760 KB | 296 KB | **83.2 %** |
| Floor plan PNG 1600×1200 | 5 138 KB | 242 KB | **95.3 %** |

Animated and vector files pass through untouched, a re-encode that would grow a
file is discarded, and if `sharp` is unavailable the upload still succeeds with
the original bytes.

**At delivery** — `next/image` with AVIF and WebP. Measured on a 109 KB JPEG:
39 KB AVIF at 1200 px wide (**−65 %**), 17 KB at 640 px.

## 10. Check page load speed — Done

Full report with numbers: **[docs/PERFORMANCE.md](./PERFORMANCE.md)**.

Headline, measured against a production build: server render 12–34 ms per page,
18–29 KB of gzipped HTML, one shared 16 KB stylesheet, ~250 KB of gzipped
first-load JavaScript. Fonts are self-hosted, so there is no render-blocking
call to Google Fonts.

- **You:** run PageSpeed Insights against the live domain — a real Lighthouse
  run needs a browser and a network, neither of which exists in the build
  sandbox. The report lists the exact checks and targets, plus the one
  remaining optimisation worth doing (framer-motion, ~30–40 KB).

## 11. Fix colour contrast — Done

Swept 16 files and computed the real WCAG ratios. Everything on the public site
now meets AA (4.5:1 for text, 3:1 for UI borders):

| Pairing | Ratio |
| --- | --- |
| Footer body text on dark | 11.3:1 |
| Accent text on dark | 6.6:1 |
| Section eyebrows on soft background | 9.3:1 |
| Body copy `gray-600` on white | 7.5:1 |
| Placeholder text / input borders | 4.8:1 |
| White on brand blue `#2563EB` | 5.1:1 |

Focus rings use `focus-visible` (so a mouse click doesn't paint a ring but a
keyboard user always gets one), interactive targets are at least 44 px tall
(WCAG 2.5.8), and animation respects `prefers-reduced-motion` in CSS *and* in
JavaScript.

## 12. Make it mobile friendly — Done

- `width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover` —
  pinch-zoom is **not** disabled (blocking it is an accessibility failure).
- Mobile-first Tailwind throughout: 162 `sm:`, 69 `md:`, 63 `lg:` breakpoints.
- 44 px minimum tap targets on the menu toggle, buttons and the save control.
- The mobile menu closes on Escape and on navigation, scrolls internally on
  short screens (`max-h-[calc(100dvh-5rem)]`), and is a proper ARIA disclosure.
- Wide tables (the cookie table, portal tables) are wrapped in horizontal
  scroll containers so nothing forces the page sideways.
- Images are responsive with correct `sizes`; the decorative desktop-only hero
  art resolves to ~0 bytes on phones.

## 13. Custom 404 page — Done

The 404 page renders on-brand: a clear explanation, the primary CTA, links to
the main sections, and a nudge to search the listings. It is the lightest page
on the site (6 KB HTML) and returns a real `404` status, verified by curl.
There is a matching 404 inside the site layout so the header and footer stay
put.

## 14. Fix broken links — Done

Crawled the whole public site from `/`, following every internal link:

- **19 URLs reached, 0 broken** (no 404s, no 500s, no redirect loops).
- **0 placeholder `href="#"` links.** The footer's social icons used to be dead
  `#` links; they are now only rendered when a real URL is configured in
  Portal → Company Settings.
- All 53 remaining `#…` links are genuine in-page anchors (legal tables of
  contents, `#inquiry`, `#buy-listings`, `#rent-listings`, the skip link) and
  **every one resolves to an element that actually exists** — checked
  programmatically across all 17 rendered routes. This caught a dead
  "Skip to main content" link on the staff login and portal pages, which had
  no `#main-content` target; both layouts now have one.
- The only external hosts referenced are `images.unsplash.com` (a preconnect
  hint) and your own canonical domain.

## 15. Form validation — Done

Shared rules in `src/lib/validation/enquiry.ts`, run **in the browser and again
on the server** so nothing depends on client-side JavaScript.

- Validates on blur and on submit; errors clear as you type and are never added
  mid-keystroke.
- An invalid submit marks every field touched and moves focus to the first
  problem field.
- Errors are wired with `aria-describedby` / `aria-invalid`; every visible
  control has a real `<label for>` (verified in the rendered HTML).
- Messages are human: *"That email address doesn't look right."*, not
  *"Invalid input"*.
- Server responses carry per-field errors and a reference number on success.

Verified end-to-end against the running API: missing name → 400, malformed
email → 400, message under 10 characters → 400, malformed phone → 400, valid
submission → 201 with reference `ENQ-0005`.

## 16. Spam protection — Done

Five layers on the public enquiry endpoint, cheapest first:

1. **16 KB body cap** — oversized payloads are rejected before parsing.
2. **Burst limit** — 20 requests per IP per 10 minutes.
3. **Honeypot** — an off-screen `company` field. Bots that fill it get a
   cheerful `201` and nothing is stored, so they never learn they were caught.
4. **Cloudflare Turnstile** — verified server-side, with an 8-second timeout
   that fails open so an outage at Cloudflare cannot block real customers.
   Skipped (and logged) when no secret key is configured.
5. **Acceptance limit** — only 5 *stored* enquiries per IP per 10 minutes.

> The two-window design is deliberate: a visitor who mistypes their email five
> times must not be locked out. Verified: 6 consecutive invalid submissions all
> return 400 and a valid one straight afterwards still succeeds; the 6th valid
> submission in the window returns 429.

- **You:** create the Turnstile widget and set both keys (docs/DEPLOYMENT.md §3).

## 17. Set up analytics — Done

**Vercel Analytics** (traffic) and **Vercel Speed Insights** (real-user Core Web
Vitals) are wired into the root layout. Analytics is gated behind cookie
consent; Speed Insights sets no cookies and always runs.

- **You:** enable both on the Vercel project (they are off by default).
  Remember that Analytics only counts visitors who accepted cookies, so
  absolute numbers read low by design — trends are still accurate.

## 18. One clear call to action — Done

**"Book a Free Consultation" → `/contact`**, defined once in
`src/constants/index.ts` as `PRIMARY_CTA` and used everywhere.

- Each section has exactly one filled button. Everything that used to compete
  with it — "Talk to a Consultant" next to "Browse Properties" on `/buy`, the
  second hero button on `/rent` — is now an underlined text link.
- The navbar carries the same CTA in short form on every page.
- Property pages have one page-level action ("Arrange a viewing") that scrolls
  to the enquiry form.

---

## 19. Before you go live — the "You" list

- [ ] Add `mcbhlues.com` and `www.mcbhlues.com` in Vercel and point DNS.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://mcbhlues.com` (no trailing slash).
- [ ] Create the Cloudflare Turnstile widget; set
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- [ ] Enable Vercel Analytics and Speed Insights on the project.
- [ ] Set `DATABASE_URL` (managed Postgres) and change the seeded Super Admin
      password.
- [ ] Replace the 11 legal placeholders and have the text reviewed:
      ```bash
      grep -rn "<Placeholder>" src/app/\(site\)/privacy src/app/\(site\)/terms
      ```
      RC number · NDPC registration · DPO email · retention period · database
      provider · email provider · payment terms · late-payment interest ·
      commission rate · liability cap.
- [ ] Update `LAST_UPDATED` on both legal pages when you publish the final text.
- [ ] Fill in the real social profile URLs in Portal → Company Settings (the
      footer hides icons with no URL, so nothing is broken until you do).
- [ ] Submit `https://mcbhlues.com/sitemap.xml` to Google Search Console.
- [ ] Run PageSpeed Insights on `/`, `/properties` and one listing.

## 20. Also fixed along the way

Not on your list, but found while working through it and fixed because they
would have undermined the items that were:

- **Saved properties were fake.** `/favorites` showed the first two listings in
  the catalogue and called them "Your Saved Properties", the navbar heart led
  there, and nothing could actually be saved. It is now real: a heart on every
  listing card and on each property page, a live counter in the navbar, and a
  list stored only in the visitor's own browser — which is what the privacy
  policy now truthfully describes. Unit-tested.
- **Buttons nested inside links.** Eleven places rendered `<a><button>…`, which
  is invalid HTML and gives keyboard and screen-reader users two stops for one
  action. There is now a `buttonClasses()` helper so a link can *look* like a
  button while staying a single, correctly-announced link. Verified: 0 nested
  interactive controls on any page.
- **Property cards were one big link** with no room for a save control. They
  are now `<article>` elements with a stretched title link — the whole card is
  still clickable, but screen readers announce one meaningful link instead of a
  wall of text.
- **Open Graph tags were being dropped** on every page that declared its own
  (see §5).
- **The HTTPS redirect could loop** behind a TLS-terminating proxy when the
  scheme was inferred from `nextUrl`. It now redirects only on an explicit
  `x-forwarded-proto: http`, and only in production.
