# Branded search & entity signals

How the site tells Google that **MCBHLUES** and **MCBHLUES Enterprises** are the
same organisation, and what was deliberately left out to keep that claim honest.

Verified against a production build (`npm run build`) on 2026-09-08 by reading
the prerendered HTML in `.next/server/app/`.

---

## 1. Two names, one entity

The business has a brand and a company name, and both are real:

| | Value | What it is | Where it is used |
| --- | --- | --- | --- |
| **Brand** | `MCBHLUES` | The wordmark. The logo renders it large, with "Enterprises" as the subtitle beneath. This is the term people type. | `WebSite.name`, `og:site_name`, `applicationName`, `Brand` schema node, `Organization.brand` + `alternateName`, `meta keywords` |
| **Business name** | `MCBHLUES Enterprises` | The company as a commercial entity. | `Organization.name`, `WebSite.alternateName`, the `%s \| …` page-title suffix, `creator` / `publisher` / `authors`, footer copyright and blurb, email signatures, legal documents |

Both live in one place — `SITE_CONFIG.brand` and `SITE_CONFIG.name` in
`src/constants/index.ts`. At runtime the business name comes from Portal →
Company Settings (`company.name`) and falls back to the constant, so renaming
the company in the portal updates the schema, the titles and the footer
together. The brand is a constant because it is the visual identity, not a
setting.

**Nothing was renamed wholesale.** Prose that describes what the company does
still says "MCBHLUES Enterprises"; the wordmark, the website node and the share
card say "MCBHLUES". Neither name was forced into every heading or paragraph.

## 2. The entity graph

`src/lib/schema.ts` builds one JSON-LD `@graph`, rendered once in
`src/app/(site)/layout.tsx`, so every public page — listings included —
describes the *same* organisation instead of its own near-duplicate:

```
Brand          #brand          name: "MCBHLUES"
                  ▲
                  │ brand, alternateName
Organization   #organization   name: "MCBHLUES Enterprises"
   (RealEstateAgent)
                  ▲
                  │ publisher
WebSite        #website        name: "MCBHLUES"
                               alternateName: "MCBHLUES Enterprises"
```

The `brand` and `alternateName` properties on the organisation, mirrored by
`alternateName` on the website, are what link the two names. It is the same
pairing the logo already makes visually — nothing is asserted that a visitor
cannot see.

Two pages add a `WebPage` node on top of the shared graph:

- **`/about`** — `AboutPage` with `about: #organization`. The one page whose
  subject *is* the company says so explicitly.
- **`/properties/[slug]`** — a `WebPage` node whose `about` is the listing and
  whose `publisher` is `#organization`, so every listing sits inside the same
  graph rather than floating as an orphaned residence.

All `@id`s are absolute (`https://mcbhlues.com/#organization`), which is what
lets separate script blocks on the same page resolve to one entity.

## 3. Only published facts are emitted

The organisation node carries `name`, `alternateName`, `brand`, `url`, `image`,
`logo`, `description`, `email`, `telephone`, `address`, `areaServed`, `sameAs`,
`knowsAbout` and a `hasOfferCatalog` built from the same three services the
homepage and footer already advertise.

There is **no** `foundingDate`, `legalName`, `taxID`, `numberOfEmployees`,
`award`, `aggregateRating` or `review`. The site publishes none of those, and a
structured-data claim the page does not support is worse than no claim at all.
`tests/seo.test.ts` asserts their absence, so a future edit cannot quietly
introduce one.

`sameAs` is emitted only from real profile URLs saved in Portal → Company
Settings; with nothing configured it is an empty array rather than a guessed
social link.

## 4. Keyword density was measured, not assumed

Brand mentions in **visible body text** (scripts, styles and `<head>` stripped)
on the prerendered pages:

| Page | Words | "MCBHLUES" | Density |
| --- | --- | --- | --- |
| `/` | 597 | 5 | 0.84% |
| `/about` | 392 | 6 | 1.53% |
| `/properties` | 295 | 4 | 1.36% |
| `/buy` | 484 | 6 | 1.24% |
| `/rent` | 389 | 5 | 1.29% |
| `/contact` | 258 | 4 | 1.55% |
| `/privacy` | 1396 | 7 | 0.50% |
| `/terms` | 1468 | 9 | 0.61% |
| `/cookies` | 395 | 4 | 1.01% |

Every page is under 2%. The only addition to body copy was one clause in the
footer that names the company. Four further visible-text edits changed casing
only ("MCBHLUES ENTERPRISES" → "MCBHLUES Enterprises") — the homepage hero
fallback, the seeded CMS value behind it, the About values intro and the Buy
FAQ intro — so the written form of the name matches the schema. No brand
mention was added or removed by them. Legal document bodies keep their all-caps
defined-term convention.

There are no hidden elements, no `display:none` brand text, no pages created to
catch a single keyword, and no separate landing pages for
"MCBHLUES properties" or "MCBHLUES real estate" — those queries are served by
`/properties`, `/buy` and `/rent`, which already exist for real reasons.

## 5. Deliberately not done

- **"MCBH Blues" is not declared anywhere.** Nothing in this repository
  establishes it as a name the business trades under, so it was not added to
  `alternateName` — that would be inventing an alias. Google already treats it
  as a tokenisation of "MCBHLUES", so nothing is lost. If it *is* a genuine
  trading name, it is a one-line change in `organizationSchema()`:
  `alternateName: [SITE_CONFIG.brand, "MCBH Blues"]`.
- **No web app manifest.** A `manifest.ts` would carry the same name /
  short-name pair, but it also turns on the browser install prompt — a product
  decision, not an SEO one.
- **No invented NAP variants.** One address, one phone number and one email,
  identical in the schema, the footer and `/contact`.

## 6. Checking it

```bash
npm test                    # tests/seo.test.ts covers the graph and the escaping
npm run build
# then read the emitted markup:
python3 - <<'PY'
import json, re, pathlib
html = pathlib.Path(".next/server/app/index.html").read_text()
for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    print(json.dumps(json.loads(b), indent=2))
PY
```

Live, paste `https://mcbhlues.com/` and `https://mcbhlues.com/about` into the
[Rich Results Test](https://search.google.com/test/rich-results) — the
organisation should validate as a `RealEstateAgent` with the brand attached.

## 7. After go-live — the part the code cannot do

Entity consistency is mostly off-site. The markup only helps if the rest of the
web agrees with it:

1. **Google Business Profile** for MCBHLUES Enterprises, with the *exact* same
   name, address and phone number as `SITE_CONFIG.contact` / Portal → Company
   Settings. Any variation weakens the match.
2. **Search Console** — verify the property, submit
   `https://mcbhlues.com/sitemap.xml`, and check *Enhancements* for schema
   errors.
3. **One consistent citation set** (LinkedIn company page, industry directories)
   using the same NAP. Add the real profile URLs in Portal → Company Settings
   and the footer icons plus `sameAs` pick them up automatically.
4. **Keep the names stable.** Changing `company.name` in the portal after
   citations exist splits the entity; if it must change, update the off-site
   listings in the same week.
