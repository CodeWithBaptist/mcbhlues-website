import { sql } from "drizzle-orm";
import type { Database } from "./index";
import { SCHEMA_DDL } from "./ddl";
import { seedDatabase } from "./seed";

/**
 * CREATE TABLE IF NOT EXISTS does not upgrade a table that already exists.
 * Add the name/title split to older databases before any seed or property read.
 * Keep existing names, slugs, timestamps and legacy location columns intact.
 */
async function upgradePropertyName(db: Database): Promise<void> {
  const column = await db.execute<{ notNull: boolean }>(sql`
    SELECT attnotnull AS "notNull"
    FROM pg_attribute
    WHERE attrelid = to_regclass('properties')
      AND attname = 'name'
      AND NOT attisdropped
  `);

  // Also finish an interrupted/manual upgrade where name is still nullable.
  if (column.rows[0]?.notNull) return;

  await db.execute(sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS name text`);
  await db.execute(sql`UPDATE properties SET name = title WHERE name IS NULL`);
  await db.execute(sql`ALTER TABLE properties ALTER COLUMN name SET NOT NULL`);
}

/**
 * Floor areas moved from square feet (`sqft`) to square metres (`sqm`). New
 * databases get `sqm` from the DDL; existing ones gain the column here with
 * their stored areas converted (1 sqft = 0.092903 sqm, rounded). Only
 * pre-migration rows (`sqm IS NULL`) convert, so re-running is a no-op, and
 * the legacy `sqft` column is left in place untouched.
 */
async function upgradePropertySqm(db: Database): Promise<void> {
  await db.execute(sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS sqm integer`);

  const legacy = await db.execute<{ present: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = to_regclass('properties')
        AND attname = 'sqft'
        AND NOT attisdropped
    ) AS "present"
  `);
  if (legacy.rows[0]?.present) {
    await db.execute(sql`UPDATE properties SET sqm = ROUND(sqft * 0.092903)::integer WHERE sqm IS NULL`);
  }

  await db.execute(sql`UPDATE properties SET sqm = 0 WHERE sqm IS NULL`);
  await db.execute(sql`ALTER TABLE properties ALTER COLUMN sqm SET NOT NULL`);
  await db.execute(sql`ALTER TABLE properties ALTER COLUMN sqm SET DEFAULT 0`);
}

/**
 * Bootstrap on one connection, atomically. The transaction-scoped advisory
 * lock serialises cold starts across server instances; it is released on
 * commit or rollback, including when a migration/seed fails.
 */
export async function bootstrapDatabase(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1296253512, 1)`);

    // Table existence is the durable first-run marker, not its row count or
    // the presence of a sample slug. An existing (even empty) catalogue belongs
    // to the owner and must never have deleted/renamed listings reinserted.
    const catalogue = await tx.execute<{ exists: boolean }>(sql`
      SELECT to_regclass('properties') IS NOT NULL AS "exists"
    `);
    const seedProperties = !catalogue.rows[0].exists;

    for (const statement of SCHEMA_DDL.split(";\n")) {
      const trimmed = statement.trim();
      if (trimmed) await tx.execute(sql.raw(trimmed));
    }

    await upgradePropertyName(tx);
    await upgradePropertySqm(tx);
    await seedDatabase(tx, { seedProperties });
  });
}
