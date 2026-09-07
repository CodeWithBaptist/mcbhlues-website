# Page-speed report

Measured against a **production build** (`npm run build` + `npx next start`,
Next.js 16.2.6, Turbopack) on 2026-09-07. Numbers are the median of 7 requests
over loopback, so they isolate **server render time and payload weight** from
network latency. Real-world timings on top of these depend on the visitor's
connection and Vercel's edge cache.

> Lighthouse / Core Web Vitals were **not** run here — the build sandbox has no
> Chrome binary and no outbound network. Field data starts flowing the moment
> the site is live: Vercel **Speed Insights** is wired into the root layout and
> reports real-user LCP / CLS / INP. See [After deploy](#after-deploy).

---

## 1. Route-by-route measurements

`TTFB` = time to first byte. `total` = full HTML document received.
`JS`/`CSS` are the **gzip-compressed** bytes of every first-party asset the
document references — i.e. the first-load cost for a cold visitor.

| Route | Code | TTFB | Total | HTML (gz) | JS (gz) | CSS (gz) | Requests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | 34 ms | 40 ms | 23.4 KB | 254.9 KB | 16.4 KB | 14 |
| `/about` | 200 | 17 ms | 20 ms | 18.4 KB | 245.8 KB | 16.4 KB | 14 |
| `/properties` | 200 | 23 ms | 28 ms | 21.8 KB | 251.9 KB | 16.4 KB | 14 |
| `/buy` | 200 | 24 ms | 29 ms | 23.9 KB | 254.9 KB | 16.4 KB | 14 |
| `/rent` | 200 | 21 ms | 25 ms | 23.0 KB | 254.4 KB | 16.4 KB | 14 |
| `/contact` | 200 | 12 ms | 16 ms | 18.1 KB | 247.8 KB | 16.4 KB | 14 |
| `/favorites` | 200 | 19 ms | 23 ms | 17.8 KB | 250.7 KB | 16.4 KB | 14 |
| `/privacy` | 200 | 15 ms | 20 ms | 28.9 KB | 242.0 KB | 16.4 KB | 13 |
| `/terms` | 200 | 15 ms | 20 ms | 28.2 KB | 242.0 KB | 16.4 KB | 13 |
| `/properties/azure-sky-penthouse` | 200 | 29 ms | 33 ms | 23.3 KB | 256.6 KB | 16.4 KB | 14 |
| `/nope-404` (custom 404) | 404 | 3 ms | 3 ms | 6.3 KB | 185.0 KB | 16.4 KB | 11 |

**Reading the table**

- Every page renders server-side in well under 40 ms. Nothing here is
  render-blocked on a slow query.
- The HTML is 18–29 KB gzipped — small enough to arrive in the first few TCP
  round trips, which is what first paint actually waits on.
- One 16.2 KB stylesheet is shared by the whole site and is `immutable`-cached,
  so it is downloaded once per release.
- The 404 page is deliberately the lightest route on the site.

---

## 2. What was optimised

### Edge caching (ISR) — the click-latency fix

The original build rendered **every** public page dynamically
(`force-dynamic`), so each click ran a full server render: a Vercel function
cold start plus several remote PostgreSQL round trips before the first byte.
Over a Lagos ↔ Vercel connection that reads as a slow site even though the
render itself takes ~30 ms.

All public pages are now statically cached at the edge with a 60-second
stale-while-revalidate window (`export const revalidate = 60`):

| Route | Behaviour |
| --- | --- |
| `/`, `/about`, `/contact`, `/buy`, `/rent`, `/favorites`, `/privacy`, `/terms`, `/cookies` | Prerendered at build, served from the edge cache (`x-nextjs-cache: HIT`), regenerated in the background every 60 s |
| `/properties` and `/properties/[slug]` | Same, and every published listing is prerendered via `generateStaticParams`; slugs created after a deploy still render on demand |
| `/portal/*`, `/api/*` | Unchanged — still rendered per request (staff tooling, always fresh) |

Measured locally against the production build (`next start`, loopback):

| Request | Before | After |
| --- | --- | --- |
| Any cached public page | full render + DB round trips per click | **5–15 ms, served from cache** |
| First render of a new listing slug | — | one render, then cached |

Cached HTML never waits more than 60 s to reflect portal edits on its own,
and edits normally publish **instantly**: every write path that touches
public content (properties incl. images/amenities/features, CMS blocks,
announcements, testimonials, FAQs, legal pages, company settings) calls
`invalidatePublicSite()` (`src/lib/cache.ts`), which purges the cached tree
via `revalidatePath`. Verified end-to-end: a CMS edit through
`/api/portal/cms/content` flips the homepage from `x-nextjs-cache: HIT` to a
fresh render containing the new copy.

Two supporting changes keep the remaining dynamic renders (portal, first
render of a new slug) fast:

- **Bootstrap revision stamp** (`src/db/bootstrap.ts`) — the idempotent seed
  used to run dozens of queries on *every* serverless cold start. A
  `schema_meta.seed_revision` stamp now skips it entirely on up-to-date
  databases; the DDL script itself is sent as a single multi-statement query
  over PostgreSQL's simple protocol (the embedded PGlite keeps the
  statement-by-statement path). Bump `BOOTSTRAP_REVISION` when changing the
  seed catalogue or upgrade steps.
- **Serverless connection pool tuning** (`src/db/index.ts`) — `max: 10`,
  TCP keep-alive and a 10 s connection timeout so warm instances reuse
  connections and unreachable databases fail fast instead of hanging renders.

Build-time prerendering needs no database credentials to succeed: during
`next build` (and only then) the app falls back to a throwaway embedded
database, so CI builds work without `DATABASE_URL`; the edge revalidates
against the real database after deploy.

### Images — the biggest lever

| Change | Effect |
| --- | --- |
| `next/image` everywhere (via `SmartImage`) with AVIF + WebP enabled | see negotiation table below |
| Explicit `width`/`height` (or `fill` + `sizes`) on every image | no layout shift (CLS) from images |
| First three cards in each listing grid get `priority` | LCP image starts downloading immediately, not after hydration |
| Decorative `hidden lg:block` hero art is lazy with `sizes="(min-width:1024px) 45vw, 1px"` | phones download ~0 bytes for it |
| Property gallery: main shot `priority`, thumbnails lazy | one eager image per page, not eight |
| Upload pipeline re-encodes staff photos to WebP, max 2400 px | table below |
| `minimumCacheTTL: 30 days` on the optimizer | repeat visitors and the CDN re-use variants |

**Format negotiation, measured** — `/og-image.jpg` (109 KB source JPEG) through
`/_next/image`:

| Requested width | AVIF | WebP | JPEG fallback |
| --- | --- | --- | --- |
| 640 px | **17.2 KB** | 18.9 KB | 23.7 KB |
| 1200 px | **38.2 KB** | 44.0 KB | 65.0 KB |

At 1200 px the AVIF variant is **65 % smaller than the original file**, and the
optimizer answers with `Vary: Accept` + `Cache-Control: public, max-age=2592000`
so each variant is cached separately for 30 days.

**Upload compression, measured** (`src/lib/media/image-compression.ts`, real
`sharp` run on synthetic photographic sources):

| Uploaded file | Before | After | Saved | Time |
| --- | --- | --- | --- | --- |
| Phone photo 4032×3024 JPEG | 3 570 KB | 226 KB | **93.7 %** | 611 ms |
| DSLR 3000×2000 JPEG | 1 760 KB | 296 KB | **83.2 %** | 492 ms |
| Floor plan 1600×1200 PNG | 5 138 KB | 242 KB | **95.3 %** | 281 ms |
| Thumbnail 320×240 JPEG | 23 KB | 10 KB | 54.6 % | 13 ms |

Animated WebP/GIF, SVG and PDF are passed through untouched, and a re-encode
that would *grow* a small file is discarded. If `sharp` cannot load, the upload
still succeeds with the original bytes — compression never blocks a listing.

### Delivery

- `compress: true` — HTML, CSS and JS are served gzip/brotli encoded.
- Hashed build assets: `Cache-Control: public, max-age=31536000, immutable`.
- `/og-image.jpg`: `public, max-age=86400, s-maxage=604800`.
- `poweredByHeader: false` — one less header on every response.
- Fonts are **self-hosted** under `src/fonts` and subset by `next/font`, so
  there is no render-blocking request to `fonts.googleapis.com` and no
  third-party DNS lookup, TLS handshake or FOUT.
- `optimizePackageImports: ["lucide-react", "framer-motion"]` — only the icons
  actually referenced are bundled instead of the whole icon set.

### Rendering

- Pages are server components; only the interactive islands (navbar, forms,
  gallery, favourites, cookie banner) ship JavaScript.
- The cookie banner and `<Analytics/>` mount **after** consent, so a first-time
  visitor's critical path contains no analytics code at all.
- Animations respect `prefers-reduced-motion` in CSS *and* via
  `useReducedMotion()`, so motion-sensitive users skip the work entirely.

---

## 3. Known headroom

**First-load JS is ~250 KB gzipped.** That is dominated by React 19 +
the App Router runtime and by **framer-motion**, which 22 section components
use for the site's scroll-reveal animations. Options, cheapest first:

1. Swap `import { motion } from "framer-motion"` for framer-motion's
   `LazyMotion` + `m` API. Estimated saving **30–40 KB gzip** across the site.
   Touches all 22 components, so it deserves its own change and its own visual
   review — it was deliberately left out of this pass.
2. Replace the simplest fade/slide reveals with a CSS
   `@keyframes` + `IntersectionObserver` helper and keep framer-motion only for
   the gallery and navbar. Larger saving, larger diff.

Neither is required for good Core Web Vitals — LCP and CLS are driven by the
HTML and the hero image, both of which are already tuned — but they would
improve INP on low-end Android devices, which matters for a Lagos audience.

**Third-party weight.** Cloudflare Turnstile (~40 KB, loaded only on pages with
a form) and Vercel Analytics (~1 KB, loaded only after consent) are the only
third-party scripts. There is no tag manager, chat widget or ad script.

---

## 4. Reproducing these numbers

```bash
npm run build
npx next start --port 3100          # needs DATABASE_URL in production mode

# TTFB, median of 7
for i in $(seq 7); do
  curl -s -o /dev/null -w '%{time_starttransfer}\n' \
    -H 'Accept-Encoding: gzip, br' http://127.0.0.1:3100/
done | sort -n | sed -n '4p'

# Compressed weight of one asset
curl -s -H 'Accept-Encoding: gzip' -o /dev/null \
  -w '%{size_download}\n' http://127.0.0.1:3100/_next/static/chunks/<hash>.js
```

---

## After deploy

Run these against the live domain — they are the numbers that count, because
they include TLS, the CDN and a real device.

1. **PageSpeed Insights** — <https://pagespeed.web.dev/> → `https://mcbhlues.com`.
   Check the mobile tab first; test `/`, `/properties` and one property detail
   page. Target: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95,
   SEO 100.
2. **Vercel Speed Insights** — project → *Speed Insights*. This is real-user
   field data and is already instrumented; it needs a few hundred visits before
   the percentiles settle. Watch p75 LCP (< 2.5 s), CLS (< 0.1), INP (< 200 ms).
3. **Vercel Analytics** — project → *Analytics*, for traffic and top pages.
   Note that it only records visitors who **accepted cookies**, so absolute
   counts read low by design; trends are still accurate.
4. **Search Console** — submit `https://mcbhlues.com/sitemap.xml` and watch the
   *Core Web Vitals* and *Page indexing* reports.

If mobile Performance comes back below 90, look at the framer-motion item in
[§3](#3-known-headroom) first; it is the largest single remaining win.
