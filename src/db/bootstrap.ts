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
    await seedDatabase(tx, { seedProperties });
  });
}
