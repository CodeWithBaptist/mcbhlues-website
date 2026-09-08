import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, test, type TestContext } from "node:test";
import { desc, eq } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Database } from "../src/db";
import { bootstrapDatabase } from "../src/db/bootstrap";
import * as schema from "../src/db/schema";
import { POST as subscribe } from "../src/app/api/public/subscribe/route";
import {
  addSubscriber,
  listSubscribers,
  setSubscriberStatus,
  summariseSubscribers,
} from "../src/lib/subscribers/subscriber-service";
import { greetingFor } from "../src/lib/newsletter/welcome-email";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  renderTemplate,
} from "../src/lib/settings/email-templates";

/**
 * The full newsletter journey, on the embedded database:
 *
 *   join the list  →  the address is stored, listed for the Staff Portal and
 *                     answered by the "Newsletter welcome" auto-reply.
 *
 * SMTP is deliberately left unconfigured, which is the state a fresh
 * deployment boots in: `sendEmail` parks the message in the outbox instead of
 * delivering it, so the auto-reply can be asserted from the database rather
 * than from a mailbox.
 */

const environment = {
  SEED_DEMO_STAFF: process.env.SEED_DEMO_STAFF,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  SMTP_HOST: process.env.SMTP_HOST,
};
process.env.SEED_DEMO_STAFF = "false";
process.env.SUPER_ADMIN_EMAIL = "subscribers-test@example.invalid";
process.env.SUPER_ADMIN_PASSWORD = randomBytes(24).toString("hex");
delete process.env.SMTP_HOST;

after(() => {
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function database(t: TestContext) {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Database;
  await client.waitReady;
  t.after(() => client.close());

  // The services resolve the database through this global, exactly as a
  // running app does — the test never touches DATABASE_URL or a real cluster.
  const globalForDb = globalThis as typeof globalThis & { __mcbhluesDb?: Promise<Database> };
  const previous = globalForDb.__mcbhluesDb;
  globalForDb.__mcbhluesDb = Promise.resolve(db);
  t.after(() => {
    globalForDb.__mcbhluesDb = previous;
  });

  await bootstrapDatabase(db);
  return db;
}

/** Unique IP per case, so the shared in-process rate limiter never blocks. */
let ipCounter = 0;
function subscribeRequest(email: string, company = "") {
  ipCounter += 1;
  return new Request("http://localhost/api/public/subscribe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `203.0.113.${ipCounter}`,
    },
    body: JSON.stringify({ email, company }),
  });
}

test("joining the list stores the address, lists it for the portal and queues the auto-reply", async (t) => {
  const db = await database(t);

  const response = await subscribe(subscribeRequest("Ada@Example.com "));
  assert.equal(response.status, 201);
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(body.ok, true);
  assert.equal(body.alreadySubscribed, false);

  // 1. Stored, normalised (lower-cased, trimmed) so the unique index works.
  const stored = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, "ada@example.com"))
    .limit(1);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].status, "active");
  assert.equal(stored[0].source, "website");

  // 2. Visible to the Staff Portal's Newsletter screen.
  const rows = await listSubscribers();
  assert.deepEqual(
    rows.map((row) => row.email),
    ["ada@example.com"]
  );

  // 3. The auto-reply was attempted and is auditable in the outbox.
  const outbox = await db
    .select()
    .from(schema.emailOutbox)
    .where(eq(schema.emailOutbox.purpose, "newsletter_welcome"))
    .orderBy(desc(schema.emailOutbox.createdAt))
    .limit(1);
  assert.equal(outbox.length, 1, "no welcome email was recorded");
  assert.equal(outbox[0].toEmail, "ada@example.com");
  assert.equal(outbox[0].status, "queued");
  assert.match(outbox[0].subject, /list/);

  // 4. The sign-up itself is in the audit trail, without the address in it.
  const audit = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.resource, "subscriber"))
    .limit(1);
  assert.equal(audit[0]?.action, "subscriber.added");
  assert.ok(!JSON.stringify(audit[0]?.metadata ?? "").includes("ada@example.com"));
});

test("a repeat sign-up is acknowledged once and never re-mailed", async (t) => {
  const db = await database(t);

  await subscribe(subscribeRequest("tunde.adeyemi@example.com"));
  const second = await subscribe(subscribeRequest("tunde.adeyemi@example.com"));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).alreadySubscribed, true);

  const rows = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, "tunde.adeyemi@example.com"));
  assert.equal(rows.length, 1, "a second row was inserted for the same address");

  const mails = await db
    .select({ id: schema.emailOutbox.id })
    .from(schema.emailOutbox)
    .where(eq(schema.emailOutbox.toEmail, "tunde.adeyemi@example.com"));
  assert.equal(mails.length, 1, "the welcome email was sent twice");
});

test("the portal can take an address off the list and put it back", async (t) => {
  const db = await database(t);
  await subscribe(subscribeRequest("grace.bello@example.com"));
  const [row] = await listSubscribers();

  const removed = await setSubscriberStatus(row.id, "unsubscribed");
  assert.equal(removed?.status, "unsubscribed");
  assert.ok(removed?.unsubscribedAt, "the opt-out timestamp was not recorded");

  const summary = summariseSubscribers(await listSubscribers());
  assert.deepEqual(
    { total: summary.total, active: summary.active, unsubscribed: summary.unsubscribed },
    { total: 1, active: 0, unsubscribed: 1 }
  );

  // Signing up again re-activates the same row rather than re-inserting it, and
  // counts as a fresh join — so the auto-reply goes out again.
  const again = await addSubscriber("grace.bello@example.com");
  assert.equal(again.alreadySubscribed, true);
  assert.equal(again.reactivated, true);
  assert.equal(again.status, "active");

  const [reopened] = await listSubscribers();
  assert.equal(reopened.id, row.id);
  assert.equal(reopened.status, "active");
  assert.equal(reopened.unsubscribedAt, null);

  // No address is ever destroyed, and the bot honeypot never becomes a row.
  const honeypot = await subscribe(subscribeRequest("bot@example.com", "SEO links"));
  assert.equal(honeypot.status, 201);
  const emails = (await listSubscribers()).map((entry) => entry.email);
  assert.ok(!emails.includes("bot@example.com"));
});

test("the newsletter module is seeded, so the screen is reachable and permitted", async (t) => {
  const db = await database(t);

  const keys = (await db.select({ key: schema.permissions.key }).from(schema.permissions))
    .map((row) => row.key);
  assert.ok(keys.includes("subscriber:read"));
  assert.ok(keys.includes("subscriber:update"));

  const nav = await db
    .select()
    .from(schema.navItems)
    .where(eq(schema.navItems.key, "newsletter"))
    .limit(1);
  assert.equal(nav[0]?.href, "/portal/subscribers");
  assert.equal(nav[0]?.permissionKey, "subscriber:read");

  // The seeded Super Admin holds it, otherwise the screen is unreachable.
  const superAdmin = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, process.env.SUPER_ADMIN_EMAIL!))
    .limit(1);
  const held = await db
    .select({ key: schema.permissions.key })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
    .innerJoin(schema.userRoles, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
    .where(eq(schema.userRoles.userId, superAdmin[0].id));
  assert.ok(held.some((row) => row.key === "subscriber:read"));

  // And the screen's data layer agrees with the public form.
  await addSubscriber("portal-check@example.com");
  assert.equal((await listSubscribers()).length, 1);
});

test("the welcome copy is an editable template with a human greeting", () => {
  const template = EMAIL_TEMPLATE_DEFAULTS.find((row) => row.key === "newsletter_welcome");
  assert.ok(template, "the portal has no Newsletter welcome template to edit");

  const rendered = renderTemplate(
    { subject: template!.subject, body: template!.body },
    { name: "Ada Adeyemi", companyName: "MCBHLUES Enterprises", listingsUrl: "https://mcbhlues.com/properties" }
  );
  assert.equal(rendered.subject, "You're on the MCBHLUES Enterprises list");
  assert.ok(rendered.body.includes("Hello Ada Adeyemi,"));
  assert.ok(rendered.body.includes("https://mcbhlues.com/properties"));
  // Unreplaced placeholders would be a bug the visitor sees.
  assert.ok(!rendered.body.includes("{{"));

  assert.equal(greetingFor("ada@example.com"), "Ada");
  assert.equal(greetingFor("tunde.adeyemi@example.com"), "Tunde Adeyemi");
  assert.equal(greetingFor("s12345@example.com"), "there");
  assert.equal(greetingFor("sales@acme.example"), "Sales");
});
