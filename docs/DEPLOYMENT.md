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
4. **Production branch:** by default Vercel deploys `main`. This work currently
   lives on `arena/01a057f7-mcbhlues-website`, so either
   * merge that branch into `main` first, or
   * push the branch and use the **Preview deployment** URL Vercel creates for
     it, or
   * set Settings → Git → Production Branch to `arena/01a057f7-mcbhlues-website`.

---

## 3. Environment variables

Settings → Environment Variables (add to **Production** and **Preview**):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Auto-set if you linked a Vercel Postgres store. |
| `SUPER_ADMIN_EMAIL` | Recommended | Email for the initial Super Admin. Defaults to `superadmin@mcbhlues.com`. |
| `SUPER_ADMIN_PASSWORD` | Recommended | Password for that account. If omitted, a strong one is generated and printed **once** in the deployment's runtime logs. |
| `SUPER_ADMIN_FIRST_NAME` / `SUPER_ADMIN_LAST_NAME` | Optional | Display name for the initial account. |
| `SEED_DEMO_STAFF` | Optional | `true` to also create the six demo role accounts (handy on a staging/preview deploy). **Never set this in production.** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Optional | Outgoing mail. Only needed if you want email configured via environment instead of the Staff Portal. The portal's **System Settings → Email delivery** screen takes priority over these. |

In production the seeder creates **only** the Super Admin — the demo accounts
(`admin@mcbhlues.com`, `salesagent@mcbhlues.com`, …) are development-only.

---

## 4. Deploy

Click **Deploy**. On the first request the app automatically:

1. creates all RBAC tables (idempotent `CREATE TABLE IF NOT EXISTS`),
2. seeds the permission catalogue, the six roles, and the navigation,
3. creates the Super Admin account.

No migration step to run. Subsequent deploys only *add* newly shipped
permissions and navigation entries — any role, permission or staff change you
made through the portal is preserved.

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

## Troubleshooting

**`DATABASE_URL is required in production`** — the variable is missing or wasn't
applied to the environment you deployed. Add it, then redeploy (env changes need
a new deployment).

**Build fails on `next/font` / Google Fonts** — that only happens in a network
-restricted sandbox. Vercel's build environment can reach Google Fonts.

**Login works but every request is slow on first hit** — that's the one-time
schema bootstrap on a cold start. Consider a small always-on database
(Neon's free tier suspends after inactivity) or Fluid/warm compute.
