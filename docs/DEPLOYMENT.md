# Deploying the MCBHLUES site + Staff Portal to Vercel

The public website is static-friendly, but the **Staff Portal needs a real
PostgreSQL database**. Vercel's filesystem is read-only and ephemeral, so the
embedded PGlite database used for local previews cannot be used there — the app
refuses to boot in production without `DATABASE_URL`, on purpose.

---

## 1. Create a PostgreSQL database

Any managed Postgres works. Easiest from inside Vercel:

**Vercel dashboard → Storage → Create Database → Neon (Postgres)**

Alternatives: [Neon](https://neon.tech), [Supabase](https://supabase.com),
Railway, RDS. Copy the connection string, which looks like:

```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

If you create the database through Vercel's Storage tab and link it to the
project, `DATABASE_URL` is injected automatically and you can skip setting it
manually below.

---

## 2. Import the repository

1. <https://vercel.com/new> → **Import Git Repository**
2. Choose `CodeWithBaptist/mcbhlues-website`
3. Framework preset: **Next.js** (auto-detected). Root directory: `./`
   Build command and output are the defaults — nothing to change.
4. **Production branch:** by default Vercel deploys `main`. Merge the approved
   fix pull request into `main` to deploy it. A pushed working branch gets its
   own **Preview deployment**; that does not replace the production release.

---

## 3. Environment variables

Settings → Environment Variables (add to **Production** and **Preview**).
`.env.example` in the repository root lists every variable with inline notes —
copy it to `.env.local` for local development.

### Public website

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin, **no trailing slash**, e.g. `https://mcbhlues.com`. Drives canonical URLs, `sitemap.xml`, `robots.txt` and every Open Graph / Twitter tag. Defaults to `https://mcbhlues.com`. Set it to the preview URL on preview deployments so previews don't advertise production URLs. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Recommended | Cloudflare Turnstile **site** key. Public by design. Omit and the widget is not rendered. |
| `TURNSTILE_SECRET_KEY` | Recommended | Cloudflare Turnstile **secret** key. Omit and captcha verification is skipped (the honeypot and rate limits still apply). Never expose this one. |
| `DISABLE_HTTPS_REDIRECT` | Optional | `true` disables the HTTP→HTTPS redirect. Only for environments that terminate TLS oddly; leave unset in production. |
| `ALLOW_FRAMING` | Optional | `true` drops the `X-Frame-Options: SAMEORIGIN` header so the site can be embedded in an iframe preview. **Read at build time** (`next.config.ts`), so changing it needs a redeploy. Leave unset in production. |

Both Turnstile keys come from **Cloudflare dashboard → Turnstile → Add site**.
Add `mcbhlues.com`, `www.mcbhlues.com` *and* your `*.vercel.app` preview domain
to the widget's hostname list, otherwise previews fail verification.

Analytics needs no variables: **Vercel Analytics** and **Speed Insights** are
wired into the root layout and activate once you enable them on the project
(Vercel dashboard → your project → *Analytics* / *Speed Insights* → **Enable**).
Analytics only loads after the visitor accepts cookies; Speed Insights collects
no cookies or personal data and always runs.

### Staff Portal

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Auto-set if you linked a Vercel Postgres store. |
| `SUPER_ADMIN_EMAIL` | Recommended | Email for the initial Super Admin. Defaults to `superadmin@mcbhlues.com`. |
| `SUPER_ADMIN_PASSWORD` | Recommended | Password for that account. If omitted, a strong one is generated and printed **once** in the deployment's runtime logs. |
| `SUPER_ADMIN_FIRST_NAME` / `SUPER_ADMIN_LAST_NAME` | Optional | Display name for the initial account. |
| `SEED_DEMO_STAFF` | Optional | `true` to also create the six demo role accounts (handy on a staging/preview deploy). **Never set this in production.** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Optional | Outgoing mail. Only needed if you want email configured via environment instead of the Staff Portal. The portal's **System Settings → Email delivery** screen takes priority over these. |
| `PGLITE_DATA_DIR` | Local only | Where the embedded development database lives. Defaults to `./.data/pgdata`. Ignored in production. |

In production the seeder creates **only** the Super Admin — the demo accounts
(`admin@mcbhlues.com`, `salesagent@mcbhlues.com`, …) are development-only.

---

## 4. Deploy

Click **Deploy**. On the first request the app automatically:

1. creates any missing tables,
2. upgrades older property tables for the separate `name` / `title` fields,
   copying the previous title into the name only where a name is missing,
3. seeds the permission catalogue, the six roles, and the navigation,
4. creates the Super Admin account if it does not already exist,
5. adds the initial sample listings **only if the properties table is new**.

Bootstrap runs in one transaction, with a database lock to serialise concurrent
server starts. A failure rolls back the whole attempt so the next request can
retry without leaving a partially upgraded schema or sample catalogue.

No manual migration step is needed for the name/title upgrade. Existing
property IDs, slugs, titles, images and related records are preserved; legacy
location columns are not dropped. Deleted or renamed sample listings are never
recreated, even when the catalogue is empty. Subsequent deploys only *add* newly
shipped permissions and navigation entries — any role, permission or staff
change you made through the portal is preserved.

---

## 5. First sign-in

1. Visit `https://<your-app>.vercel.app/portal/login`
2. Sign in as the Super Admin.
3. **Change the password immediately** (use the **Change Password** screen in
   the account menu — `/portal/account/password` — or set
   `SUPER_ADMIN_PASSWORD` and redeploy).
4. Create the real staff accounts and send each person their invitation link.

---

## 6. Production hardening checklist

- [ ] `SEED_DEMO_STAFF` is **not** set (or is `false`).
- [ ] `ALLOW_FRAMING` and `DISABLE_HTTPS_REDIRECT` are **not** set in Production.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the canonical domain exactly, with no
      trailing slash and no `www.` mismatch.
- [ ] Both Turnstile keys are set, and the widget's hostname list includes the
      production domain.
- [ ] Super Admin password changed from the seeded/generated value.
- [ ] Session cookies are already `Secure` + `httpOnly` + `SameSite=Lax` in
      production — no action needed, but keep the site on HTTPS.
- [x] Email transport wired. Customer enquiry replies, auto-replies, staff
      invitations and password resets are now sent automatically through
      `src/lib/email/mailer.ts`. Configure SMTP under **System Settings →
      Email delivery** (or via `SMTP_*` env vars) and use **Send me a test
      email**. Every attempt is recorded in **System Logs** (`/portal/logs`).
      Until SMTP is configured, outgoing messages are stored as "queued".
- [ ] Review the seeded role permissions on `/portal/roles` against how your
      team actually works.
- [x] The demo-credentials panel at the bottom of
      `src/app/(staff-auth)/portal/login/page.tsx` has been removed.

---

## 7. Custom domain, HTTPS and search engines

1. **Add the domain** — Vercel project → *Settings* → *Domains* → add
   `mcbhlues.com` **and** `www.mcbhlues.com`. Point one at the other as the
   redirect target (`www` → apex is the convention used here) so the site has a
   single canonical origin.
2. **DNS** — follow the records Vercel shows: an `A` record for the apex and a
   `CNAME` for `www`. Certificates are issued automatically once DNS resolves.
3. **HTTPS is enforced in three places**, so there is no plaintext window:
   - Vercel redirects HTTP → HTTPS at the edge;
   - `src/proxy.ts` 308-redirects any request arriving with
     `x-forwarded-proto: http` (production only, and skippable with
     `DISABLE_HTTPS_REDIRECT` for odd TLS setups);
   - every production response carries
     `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
     so browsers refuse plaintext on their own after the first visit.

   Because the HSTS header includes `preload`, you can submit the domain at
   <https://hstspreload.org/> once you are confident **every** subdomain will
   stay on HTTPS permanently. This is hard to undo — do it last.
4. **Verify the security headers** after the first production deploy:

   ```bash
   curl -sI https://mcbhlues.com | grep -iE \
     'strict-transport|x-content-type|referrer-policy|permissions-policy|x-frame'
   ```

   Expected: HSTS as above, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy`
   denying camera/microphone/geolocation/browsing-topics, and
   `X-Frame-Options: SAMEORIGIN`.
5. **Search engines** — Google Search Console and Bing Webmaster Tools:
   verify the domain, then submit `https://mcbhlues.com/sitemap.xml`.
   `robots.txt` already points at it and disallows `/portal`, `/admin`,
   `/api/` and `/favorites`.
6. **Social preview** — paste a page URL into
   <https://cards-dev.twitter.com/validator> and Facebook's
   [Sharing Debugger](https://developers.facebook.com/tools/debug/) and hit
   *Scrape Again*. You should see the 1200×630 card from `/og-image.jpg`
   (property pages use the listing photo instead).

---

## 8. Legal pages

`/privacy` and `/terms` are full drafts, but they contain **11 highlighted
placeholders** — company registration number, registered address, Data
Protection Officer email, payment terms, liability cap and similar. They render
with a visible amber highlight and an "information still to be confirmed"
screen-reader label, so they cannot be missed.

List them before launch:

```bash
grep -rn "<Placeholder>" src/app/\(site\)/privacy src/app/\(site\)/terms
```

Replace every one, bump the `LAST_UPDATED` constant at the top of each page,
and have the final text reviewed by a Nigerian legal adviser — the drafts
reference the NDPA 2023 but are not legal advice.



**`DATABASE_URL is required in production`** — the variable is missing or wasn't
applied to the environment you deployed. Add it, then redeploy (env changes need
a new deployment).

**Site fails after the name/title update (`column "name" ... does not exist`)**
— older releases changed `CREATE TABLE IF NOT EXISTS` but did not migrate the
existing properties table. Deploy the release containing the bootstrap fix; the
first database-backed request safely adds and backfills `properties.name`.
Do **not** drop/reset the database or reimport the sample catalogue. Confirm
`/api/health` returns `{"ok":true}`, then check the homepage and Staff Portal.
The database connection needs schema-alter permissions, as it already does
for the application's automatic table creation. If the health check still
fails, inspect Vercel's runtime logs for the underlying database error.

**A deleted sample listing returns after a restart** — older releases treated
any missing seed slug as a request to recreate it. The bootstrap fix only
seeds listings when the properties table is first created. It does not remove
previously recreated rows automatically: review those in the portal and delete
only the listings you no longer want.

**Font loading** — fonts are self-hosted under `src/fonts`; builds do not need
to reach Google Fonts.

**Login works but every request is slow on first hit** — that's the one-time
schema bootstrap on a cold start. Consider a small always-on database
(Neon's free tier suspends after inactivity) or Fluid/warm compute.

## Regression checks

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` before
deploying. The database tests use isolated, in-memory PGlite databases (never
`DATABASE_URL` or your live property data). They cover the previous schema,
partial upgrades, repeated/concurrent bootstrap calls, failed-startup rollback,
and deleting/renaming listings without losing enquiry or booking history.
