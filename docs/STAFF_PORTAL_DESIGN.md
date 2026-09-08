# Staff Portal visual alignment

## Source of truth

Inspected the public navbar, Logo, Button/buttonClasses, Input/Textarea,
PropertyCard/SmartImage, section headings, local font configuration and public
theme mappings before changing the portal.

- **Typography:** existing Poppins headings and Inter body rules, unchanged font files.
- **Palette:** existing primary, primary-dark and primary-light; the public white/slate
  surfaces and their exact dark equivalents. Status colors remain semantic, not metric decoration.
- **Navigation:** the same logo, medium-weight links, understated brand-color active
  rules, shared theme control, and quiet hover/focus feedback.
- **Controls:** existing Button and Input components stay in use; native portal
  controls match their rectangular radius, touch targets, borders and focus language.
- **Photography:** property thumbnails use the public SmartImage renderer and 4:3
  crop. Failed images show an honest “Image unavailable” state; no data or photos
  were replaced to disguise unavailable external services.

## Scope

No backend, API, database, auth/session/security, RBAC or route definitions changed.
Existing navigation groups, destinations, record fields, actions and permission
checks remain. The only additional company read supplies the existing public logo
setting to the portal shell/authentication chrome.

Removed decorative gradients, oversized colored metric cards, floating/glowing
indicators, nested shortcut cards, random staff avatar colors and unsupported
“all systems operational”/“live” decoration. The real SystemHealth checks remain.

The section-search control keeps its existing three navigation suggestions. Its
label now describes what it actually does, rather than promising an unimplemented
all-record search. Mobile uses that same existing input/state instead of a separate
unwired field. No search endpoint was added.

### Theme implementation

`globals.css` owns one `--site-*` public palette. Existing `--public-*` and
`--portal-*` variable names are aliases, not separate color systems. Public utility
mappings now apply to the staff surfaces too. `portal.css` supplies only operational
density, responsive records and remaining legacy semantic utility mappings.

ThemeProvider is shared across both surfaces, using the existing public storage
key. The pre-paint bootstrap prefers the public preference, falls back to the old
portal preference if there is no public preference, then the OS preference. Theme
changes persist on interaction, sync across tabs and still work if storage is
blocked. Subscription setup reconciles changes made during another tab's hydration
without overwriting a newer preference with an initial light snapshot.

### Responsive behavior

- Desktop sidebar still collapses and remembers its state.
- Mobile drawer stays expanded regardless of desktop preference. Escape, focus
  containment, focus return, scroll locking and breakpoint changes are handled.
- Record tables retain every field/action and reflow into labeled mobile records.
- The permission matrix remains a real two-dimensional, keyboard-focusable
  horizontal scroller with a pinned row label on small screens.
- Input text is at least 16px on mobile; main controls have 44px touch targets.
- Existing reduced-motion support remains, with stronger staff-scoped overrides.

## Verification (2026-09-08)

Using the existing seeded accounts in an **isolated local PGlite database**, not a
production database:

- Production build and TypeScript check passed.
- All 30 existing unit/integration tests passed.
- Eight Playwright scenarios passed, including 22 portal routes × 3 widths
  (1440, 768, 390) × 2 themes = **132 route/layout checks**.
- No document-level horizontal overflow, portal runtime exceptions or React console
  errors in that route matrix. Third-party resource failures are excluded separately.
- Navigation filtering, collapsed-state persistence, mobile drawer keyboard/focus
  handling, account navigation, property filtering/empty state and validation checked.
- Create forms opened for customers, bookings, staff, roles, permissions, FAQs,
  announcements and testimonials without submitting changes to existing records.
- Sign-in/password visibility, invalid login feedback, logout and invalid invitation
  presentation checked. Authentication shell also checked at 320px.
- Shared theme continuity, cross-tab synchronization, storage-blocked fallback and
  reduced motion checked.
- Explicitly opted-in disposable property test exercised create, local image upload,
  edit, publish, status update, unpublish and delete through the real UI/APIs.
- Screenshots reviewed for public-site comparison, dashboard, properties, staff,
  roles, permissions, settings, authentication, mobile navigation and mobile editor.
- Lint passes for all changed TypeScript files; `git diff --check` passes.

### Known verification limits / pre-existing issues

- Full-repository lint still fails on the **unchanged**
  `src/components/portal/security-timeout.tsx:15` (`useRef(Date.now())`,
  `react-hooks/purity`). Security timeout behavior was deliberately not changed.
- The sandbox cannot reach the existing Unsplash/Picsum demo-image hosts (TLS/network
  failures). Remote photography cannot be visually approved here. Local upload and
  rendering were tested successfully; existing remote image URLs are untouched.
- Real SMTP delivery, successful emailed invitation activation, every role's
  authorization permutation, destructive staff/permission changes, security-setting
  mutations and every CRM/CMS save path are **not** claimed as end-to-end verified.
  Their existing presentation/route/form coverage is described above.
- A pre-existing reduced-motion hydration warning in the public homepage CTA was
  observed during comparison; that public section was not modified.

## Re-running browser checks

Start the app against a disposable development database, then:

```sh
npm ci
npx playwright install --with-deps chromium
# Start npm run dev (or build/start) separately.
export PORTAL_E2E_BASE_URL=http://localhost:3000
export PORTAL_E2E_EMAIL=<local-super-admin-email>
export PORTAL_E2E_PASSWORD=<local-test-password>
npm run test:ui
```

Authenticated cases skip when credentials are absent. To exercise the real property
write/upload workflow, opt in **only with a disposable database**:

```sh
PORTAL_E2E_ALLOW_WRITES=true npm run test:ui
```

That test deletes its property on success, but upload/audit records remain in the
disposable database. A failed mutation test can leave its `UI regression ...`
fixture for investigation. Never run write checks against live data.

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally points at an already installed
Chromium in restricted environments. Browser downloads, screenshots, database files
and test reports are ignored; no runtime browser dependency is shipped.
