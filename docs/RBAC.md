# MCBHLUES Staff Portal — RBAC Architecture

A database-driven Role-Based Access Control system. **No role names or permission
sets are hardcoded in application logic** — everything is stored in PostgreSQL and
can be changed at runtime from the portal itself.

---

## 1. Data model

| Table | Purpose |
| --- | --- |
| `permissions` | Atomic permission catalogue (`resource:action`, e.g. `property:publish`). Extensible at runtime. |
| `roles` | Roles with a `level` (hierarchy), `is_system` and `is_assignable` flags. |
| `role_permissions` | Which permissions a role grants. |
| `users` | Staff accounts (`invited` / `active` / `disabled`). |
| `user_roles` | A staff member may hold **one or more** roles. |
| `user_permissions` | **Optional individual overrides** with `effect = allow \| deny`. |
| `sessions` | Server-side sessions; only a SHA-256 hash of the token is stored. |
| `invitations` | Single-use, expiring invitation tokens (hashed at rest). |
| `nav_items` | Staff Portal navigation, each entry bound to a permission key. |
| `audit_logs` | Sensitive administrative actions. |
| `activity_logs` | Routine staff activity. |
| `settings` | Company / system settings, scoped by permission. |

### Effective permissions

```
effective = (permissions of all assigned roles)
          + (individual overrides with effect = "allow")
          - (individual overrides with effect = "deny")     ← deny always wins
```

Resolved in `src/lib/auth/session.ts` → `resolveUserPermissions()`.

### Hierarchy

`roles.level` drives "who may administer whom" (`canManageLevel` in
`src/lib/rbac/can.ts`). An Admin (level 80) therefore cannot edit, disable,
re-role or delete a Super Admin (level 100) — enforced by data, not by a
hardcoded `if (role === 'super_admin')`.

Additional escalation guards:

* You can never grant a permission you do not hold yourself (roles **and**
  individual overrides).
* You can never create or edit a role at or above your own level.
* The Super Admin role cannot be stripped of core administration permissions.

---

## 2. Enforcement layers

| Layer | File | Purpose |
| --- | --- | --- |
| Edge middleware | `src/middleware.ts` | Fast redirect for cookie-less traffic. **Convenience only.** |
| Page guard | `src/lib/rbac/page-guard.ts` | `pageAccess("staff:read")` in every portal page → redirect or Access Denied. |
| API guard | `src/lib/rbac/api-guard.ts` | `withPermission("staff:create", handler)` wraps every route handler. |
| Service guards | `src/lib/rbac/staff-service.ts` | Hierarchy assertions for staff/role administration. |
| Frontend | `src/components/portal/permission-provider.tsx` | `useSession()`, `usePermission()`, `<Can permission="…">` — **UX only**. |

Typing an API URL manually does not bypass anything: the handler re-verifies
authentication, identity, roles and permissions against the database on every
request. Session records are also revoked immediately when an account is
disabled, its roles change, or its permissions change.

---

## 3. Roles shipped by the seed

| Role | Level | Focus |
| --- | --- | --- |
| Super Admin | 100 | Everything (auto-granted every permission, including future ones) |
| Admin | 80 | Operations: properties, customers, enquiries, bookings, CMS, media, reports, activity logs |
| Property Manager | 50 | Property operations + property-related enquiries/bookings |
| Sales Agent | 40 | Assigned customers, enquiries, bookings; available/assigned properties |
| Reception | 30 | Customers, enquiries, bookings intake and forwarding |
| Content Manager | 30 | Public website CMS + website media |

Roles are **seeded once**. After that they are ordinary rows: edit their
permissions on `/portal/roles`, add new roles, or add new permissions on
`/portal/permissions`. The seeder never overwrites runtime changes; it only adds
permissions/roles/nav entries that do not exist yet.

---

## 4. Role-based navigation

`nav_items` rows carry `permission_key` (required to see the entry) and an
optional `hide_if_permission_key` (hide when the user holds a broader
permission). `getNavigationForUser()` filters the list — links to pages the user
cannot open are never rendered, and the pages themselves are independently
guarded.

Resulting menus:

* **Super Admin** — Dashboard, Properties, Customers, Enquiries, Bookings, Website CMS, Media Library, Testimonials, FAQs, Announcements, Staff Management, Roles, Permissions, Notifications, Reports, Activity Logs, Audit Logs, Company Settings, System Settings
* **Admin** — Dashboard, Properties, Customers, Enquiries, Bookings, Website CMS, Media Library, Notifications, Reports, Activity Logs
* **Property Manager** — Dashboard, Properties, Property Enquiries, Property Bookings, Notifications
* **Sales Agent** — Dashboard, Assigned Properties, Customers, Assigned Enquiries, Assigned Bookings, Notifications
* **Reception** — Dashboard, Customers, Enquiries, Bookings, Notifications
* **Content Manager** — Dashboard, Website CMS, Media Library, Testimonials, FAQs, Announcements

---

## 5. Staff account lifecycle

1. Super Admin creates the account (first name, last name, email, phone, role).
2. A secure invitation token is generated (random 32 bytes, SHA-256 hashed at
   rest, 72 h expiry, single use). The link is returned in the UI for copying;
   plug in a mail transport to send it.
3. The staff member opens `/portal/invite/<token>` and sets their own password
   (scrypt hashed, strength policy enforced server-side). Status → `active`.
4. Accounts can be activated/deactivated, re-roled, given individual permission
   overrides, password-reset (revokes all sessions and re-issues an invitation)
   or removed.
5. Every one of those actions is written to the audit log.

Staff change their **own** password on the **Change Password** screen
(`/portal/account/password`, visible to every signed-in user in the Account
nav group). The route verifies the current password, updates the hash and
revokes every *other* session while keeping the current one — so a password
change never logs the user out. Admin-initiated password resets still set the
account to `invited` and require a fresh invitation link; the admin reset route
rejects resetting your *own* account (use Change Password instead) so nobody
accidentally locks themselves out.

---

## 6. Audit logging

`recordAudit()` stores: acting user id + email, action, resource, resource id,
JSON metadata, IP address, user agent and timestamp. Tracked actions include
`staff.created`, `staff.removed`, `staff.role_changed`,
`staff.permissions_changed`, `role.permissions_changed`, `permission.created`,
`property.deleted`, `property.published`, `booking.status_changed`,
`settings.changed`, `auth.login_succeeded`, `auth.login_failed`.

`recordActivity()` stores routine staff activity separately.

---

## 7. Permission catalogue

Grouped by module in `src/db/seed-data.ts`, e.g.

```
property:create   property:read   property:update   property:delete   property:publish
property:assign   property:image_manage   property:amenity_manage   property:feature_manage
property:location_manage   property:status_update   property:price_update
customer:create   customer:read   customer:update   customer:delete
enquiry:create    enquiry:read    enquiry:update    enquiry:delete    enquiry:assign
booking:create    booking:read    booking:update    booking:delete    booking:approve
cms:read          cms:update      media:upload      media:read        media:delete
staff:create      staff:read      staff:update      staff:delete
role:create       role:read       role:update       role:delete
permission:read   permission:update
report:read       settings:read   settings:update   activity:read     audit:read
```

Custom permissions can be added at runtime on `/portal/permissions` and attached
to any role — no deployment required.

---

## 8. Running it

The portal needs PostgreSQL. Set `DATABASE_URL` to use a real server; without it
the app boots an embedded PostgreSQL (PGlite) under `.data/pgdata`, so the
schema, seeding and every permission check still run against real SQL.

```bash
npm install
npm run dev          # http://localhost:3000/portal
```

Demo accounts created on first boot:

| Email | Password | Role |
| --- | --- | --- |
| superadmin@mcbhlues.com | SuperAdmin@123 | Super Admin |
| admin@mcbhlues.com | Admin@123 | Admin |
| propertymanager@mcbhlues.com | Property@123 | Property Manager |
| salesagent@mcbhlues.com | Sales@123 | Sales Agent |
| reception@mcbhlues.com | Reception@123 | Reception |
| contentmanager@mcbhlues.com | Content@123 | Content Manager |

> Change or remove these before going anywhere near production, and set a real
> `DATABASE_URL`.

---

## 9. Operational modules

Every sidebar destination is a fully implemented module backed by its own
tables, permission-checked API routes and audit logging:

| Module | Route | Tables | Public website tie-in |
| --- | --- | --- | --- |
| Properties | `/portal/properties` | `properties`, `property_*` | Listings, homepage feature rail |
| Customers | `/portal/customers` | `customers`, `customer_notes`, `customer_saved_properties` | — |
| Enquiries | `/portal/enquiries` | `enquiries`, `enquiry_notes` | Contact page + property inquiry forms post to `/api/public/enquiries` |
| Bookings | `/portal/bookings` | `bookings` | — |
| Website CMS | `/portal/cms` | `cms_content` | Homepage hero copy |
| Testimonials / FAQs / Announcements | `/portal/cms/*` | `testimonials`, `faqs`, `announcements` | Homepage testimonials, Buy page FAQ, site banner |
| Media Library | `/portal/media` | `media_assets` | URL registry for listings & CMS |
| Notifications | `/portal/notifications` | `notifications` | In-app bell in the portal topbar |
| Reports | `/portal/reports` | (aggregates) | — |
| System Settings | `/portal/settings/system` | `settings`, `email_templates` | Session TTL, invite TTL and password policy honour the saved values |

Workflow events cross-pollinate: new enquiries and bookings notify the right
permission holders, and assignments notify the assignee directly.

---

## 10. Adding a protected feature

```ts
// API route
export const POST = withPermission("contract:sign", async (request, { user }) => {
  // ... user is authenticated and holds contract:sign
});
```

```tsx
// Page
const access = await pageAccess("contract:sign");
if (!access.allowed) return <AccessDenied required={access.required} />;
```

```tsx
// UI affordance (never the security boundary)
<Can permission="contract:sign">
  <Button>Sign contract</Button>
</Can>
```

Then add the permission on `/portal/permissions`, tick it for the relevant roles
on `/portal/roles`, and (optionally) insert a `nav_items` row bound to it.
