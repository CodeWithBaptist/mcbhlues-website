import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, test, type TestContext } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Database } from "../src/db";
import { bootstrapDatabase } from "../src/db/bootstrap";
import { PROPERTY_SEED } from "../src/db/seed-properties";
import * as schema from "../src/db/schema";
import {
  deleteProperty,
  getPropertyBySlug,
  listPublishedProperties,
} from "../src/lib/properties/property-service";

// These tests never use DATABASE_URL or the preview's on-disk database.
// Keep fixture credentials ephemeral and out of seed logs.
const environment = {
  SEED_DEMO_STAFF: process.env.SEED_DEMO_STAFF,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};
process.env.SEED_DEMO_STAFF = "false";
process.env.SUPER_ADMIN_EMAIL = "bootstrap-test@example.invalid";
process.env.SUPER_ADMIN_PASSWORD = randomBytes(24).toString("hex");
after(() => {
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function database(t: TestContext, logQuery?: (query: string) => void) {
  const client = new PGlite();
  const db = drizzle(client, {
    schema,
    logger: logQuery ? { logQuery } : undefined,
  }) as unknown as Database;
  await client.waitReady;
  t.after(() => client.close());
  return { client, db };
}

function usePropertyServiceDatabase(t: TestContext, db: Database) {
  const globalForDb = globalThis as typeof globalThis & { __mcbhluesDb?: Promise<Database> };
  const previous = globalForDb.__mcbhluesDb;
  globalForDb.__mcbhluesDb = Promise.resolve(db);
  t.after(() => { globalForDb.__mcbhluesDb = previous; });
}

async function createLegacyCatalogue(client: PGlite) {
  await client.exec(await readFile(new URL("./fixtures/legacy-properties.sql", import.meta.url), "utf8"));
}

const listingId = "00000000-0000-4000-8000-000000000001";

test("upgrades the previous schema without replacing the owner's property data", async (t) => {
  const { client, db } = await database(t);
  await createLegacyCatalogue(client);
  await client.query(`
    INSERT INTO properties (
      id, title, slug, price, city, postal_code, google_maps_url,
      sqft, is_published, created_at, updated_at
    ) VALUES ($1, 'Owner-edited residence', 'my-existing-listing', 91000000,
      'Lagos', '101233', 'https://maps.example.invalid/original',
      1076, true, '2026-08-01T12:00:00Z', '2026-09-01T12:00:00Z')
  `, [listingId]);
  const before = (await client.query<Record<string, unknown>>("SELECT * FROM properties")).rows[0];

  await bootstrapDatabase(db);

  const after = (await client.query("SELECT * FROM properties")).rows;
  // 1076 sqft converts to 100 sqm; the legacy sqft column is left untouched.
  assert.deepEqual(after, [{ ...before, name: "Owner-edited residence", sqm: 100 }]);
  usePropertyServiceDatabase(t, db);
  assert.equal((await listPublishedProperties())[0].name, "Owner-edited residence");
  assert.equal((await listPublishedProperties())[0].sqm, 100);
  assert.equal((await getPropertyBySlug("my-existing-listing"))?.id, listingId);

  // A second cold start must preserve the owner's now-separate name and title.
  await db.update(schema.properties).set({ name: "A custom building name" })
    .where(eq(schema.properties.id, listingId));
  await bootstrapDatabase(db);
  assert.equal((await getPropertyBySlug("my-existing-listing"))?.name, "A custom building name");
  const column = await client.query<{ attnotnull: boolean }>(`
    SELECT attnotnull FROM pg_attribute
    WHERE attrelid = 'properties'::regclass AND attname = 'name'
  `);
  assert.equal(column.rows[0].attnotnull, true);
});

test("finishes a nullable-name upgrade without overwriting existing names", async (t) => {
  const { client, db } = await database(t);
  await createLegacyCatalogue(client);
  await client.exec(`
    ALTER TABLE properties ADD COLUMN name text;
    INSERT INTO properties (title, slug, name) VALUES
      ('Original title', 'without-name', NULL),
      ('Marketing headline', 'with-name', 'Owner-supplied name');
  `);
  await bootstrapDatabase(db);
  const rows = await db.select({ title: schema.properties.title, name: schema.properties.name })
    .from(schema.properties).orderBy(schema.properties.slug);
  assert.deepEqual(rows, [
    { title: "Marketing headline", name: "Owner-supplied name" },
    { title: "Original title", name: "Original title" },
  ]);
});

test("does not repopulate an empty catalogue from an older deployment", async (t) => {
  const { client, db } = await database(t);
  await createLegacyCatalogue(client);
  await bootstrapDatabase(db);
  await bootstrapDatabase(db);
  assert.deepEqual(await db.select().from(schema.properties), []);
});

test("seeds a new database once, including under concurrent bootstrap calls", async (t) => {
  const { db } = await database(t);
  await Promise.all([bootstrapDatabase(db), bootstrapDatabase(db), bootstrapDatabase(db)]);
  const properties = await db.select().from(schema.properties).orderBy(schema.properties.slug);
  assert.deepEqual(properties.map(({ slug, name }) => ({ slug, name })),
    PROPERTY_SEED.map(({ slug, name }) => ({ slug, name })).sort((a, b) => a.slug.localeCompare(b.slug)));
  assert.equal((await db.select().from(schema.propertyImages)).length,
    PROPERTY_SEED.reduce((total, seed) => total + seed.images.length, 0));
  await bootstrapDatabase(db);
  assert.deepEqual(await db.select().from(schema.properties).orderBy(schema.properties.slug), properties);
});

test("deleting or renaming listings survives cold starts and keeps enquiry/booking history", async (t) => {
  const { db } = await database(t);
  await bootstrapDatabase(db);
  usePropertyServiceDatabase(t, db);
  const initial = await listPublishedProperties();
  const property = initial.find((row) => row.slug === PROPERTY_SEED[0].slug)!;
  const renamed = initial.find((row) => row.id !== property.id)!;
  const [staff] = await db.select().from(schema.users).limit(1);
  const [customer] = await db.insert(schema.customers)
    .values({ firstName: "Test", lastName: "Customer" }).returning();
  await db.insert(schema.propertyAssignments).values({ propertyId: property.id, userId: staff.id });
  await db.insert(schema.customerSavedProperties).values({ propertyId: property.id, customerId: customer.id });
  const [enquiry] = await db.insert(schema.enquiries).values({
    reference: "ENQ-TEST", name: "Test Customer", propertyId: property.id, customerId: customer.id,
  }).returning();
  const [booking] = await db.insert(schema.bookings).values({
    reference: "BKG-TEST", name: "Test Customer", scheduledAt: new Date("2026-10-01T12:00:00Z"),
    propertyId: property.id, customerId: customer.id,
  }).returning();

  assert.equal(await deleteProperty(property.id), true);
  assert.equal(await deleteProperty(property.id), false);
  await db.update(schema.properties).set({ slug: "owner-renamed-listing", name: "Owner's new name" })
    .where(eq(schema.properties.id, renamed.id));
  await bootstrapDatabase(db);
  await bootstrapDatabase(db);

  assert.equal(await getPropertyBySlug(property.slug), null);
  assert.equal(await getPropertyBySlug(renamed.slug), null);
  assert.equal((await getPropertyBySlug("owner-renamed-listing"))?.name, "Owner's new name");
  assert.equal((await listPublishedProperties()).length, initial.length - 1);
  assert.deepEqual(await db.select().from(schema.enquiries), [{ ...enquiry, propertyId: null }]);
  assert.deepEqual(await db.select().from(schema.bookings), [{ ...booking, propertyId: null }]);
  assert.deepEqual(await db.select().from(schema.customers), [customer]);
  assert.deepEqual(await db.select().from(schema.propertyAssignments), []);
  assert.deepEqual(await db.select().from(schema.customerSavedProperties), []);
  assert.deepEqual(await db.select().from(schema.propertyImages)
    .where(eq(schema.propertyImages.propertyId, property.id)), []);
  assert.deepEqual(await db.select().from(schema.propertyAmenities)
    .where(eq(schema.propertyAmenities.propertyId, property.id)), []);
  assert.deepEqual(await db.select().from(schema.propertyFeatures)
    .where(eq(schema.propertyFeatures.propertyId, property.id)), []);

  // Deleting the final listing is valid, too: empty is not "uninitialised".
  for (const row of await listPublishedProperties()) await deleteProperty(row.id);
  await bootstrapDatabase(db);
  assert.deepEqual(await listPublishedProperties(), []);
  assert.deepEqual(await db.select().from(schema.propertyImages), []);
});

test("a failed first bootstrap rolls back and can be retried without a partial catalogue", async (t) => {
  let injectFailure = true;
  const { client, db } = await database(t, (query) => {
    if (injectFailure && query.startsWith('insert into "property_images"')) {
      throw new Error("Simulated seed failure");
    }
  });
  await assert.rejects(bootstrapDatabase(db));
  const tables = await client.query<{ catalogue: string | null }>(
    "SELECT to_regclass('properties')::text AS catalogue"
  );
  assert.equal(tables.rows[0].catalogue, null);

  injectFailure = false;
  await bootstrapDatabase(db);
  assert.equal((await db.select().from(schema.properties)).length, PROPERTY_SEED.length);
  assert.equal((await db.select().from(schema.propertyImages)).length,
    PROPERTY_SEED.reduce((total, seed) => total + seed.images.length, 0));
});
