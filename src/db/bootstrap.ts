import { sql } from "drizzle-orm";
import type { Database } from "./index";
import { SCHEMA_DDL } from "./ddl";
import { seedDatabase } from "./seed";

/**
 * Seed revision stamp.
 *
 * Every cold start of a serverless instance used to re-run the whole
 * idempotent seed — dozens of database round trips before the first page
 * could render. The DDL still runs on every boot (it is cheap and fully
 * idempotent, sent as a single script on PostgreSQL), but the expensive
 * upgrade + seed phase now only runs when the stored revision lags behind
 * this constant.
 *
 * **Bump this number in the same commit that changes the seed catalogue or
 * the upgrade steps below**, so existing databases pick the change up on
 * their next boot.
 */
const BOOTSTRAP_REVISION = 1;

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

export interface BootstrapOptions {
  /**
   * Whether the driver accepts multiple statements in a single query. The
   * `pg` driver sends parameterless queries over PostgreSQL's simple query
   * protocol, which executes a whole script in one round trip. The embedded
   * PGlite database only speaks the extended protocol and rejects
   * multi-command queries, so it gets the statement-by-statement path.
   */
  multiStatement: boolean;
}

/**
 * Apply the idempotent schema script — as one script where the driver allows,
 * otherwise statement by statement. Stays inside the bootstrap transaction so
 * a failed boot rolls back without leaving a partial schema behind.
 */
async function applySchema(tx: Database, { multiStatement }: BootstrapOptions): Promise<void> {
  if (multiStatement) {
    await tx.execute(sql.raw(SCHEMA_DDL));
    return;
  }
  for (const statement of SCHEMA_DDL.split(";\n")) {
    const trimmed = statement.trim();
    if (trimmed) await tx.execute(sql.raw(trimmed));
  }
}

/**
 * Bootstrap on one connection, atomically. The transaction-scoped advisory
 * lock serialises cold starts across server instances; it is released on
 * commit or rollback, including when a migration/seed fails.
 *
 * Steady-state cost for an up-to-date database: the advisory lock, the
 * revision check and (on PostgreSQL) the DDL script as a single round trip —
 * a handful of round trips instead of the full seed. The upgrade/seed phase
 * only runs on fresh databases or after a release bumped
 * `BOOTSTRAP_REVISION`.
 */
export async function bootstrapDatabase(
  db: Database,
  options: BootstrapOptions = { multiStatement: false }
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1296253512, 1)`);

    // Table existence is the durable first-run marker, not its row count or
    // the presence of a sample slug. An existing (even empty) catalogue belongs
    // to the owner and must never have deleted/renamed listings reinserted.
    const catalogue = await tx.execute<{ exists: boolean }>(sql`
      SELECT to_regclass('properties') IS NOT NULL AS "exists"
    `);
    const seedProperties = !catalogue.rows[0].exists;

    // Fully idempotent, so it runs on every boot — new tables/indexes shipped
    // by a release apply without anyone having to remember a version bump.
    await applySchema(tx, options);

    // Revision stamp: created before it is read so a first boot sees 0.
    await tx.execute(
      sql`CREATE TABLE IF NOT EXISTS schema_meta (seed_revision integer NOT NULL)`
    );
    const stamp = await tx.execute<{ revision: number }>(
      sql`SELECT COALESCE(MAX(seed_revision), 0) AS revision FROM schema_meta`
    );
    if (Number(stamp.rows[0]?.revision ?? 0) >= BOOTSTRAP_REVISION) return;

    await upgradePropertyName(tx);
    await upgradePropertySqm(tx);
    await seedDatabase(tx, { seedProperties });

    await tx.execute(sql`DELETE FROM schema_meta`);
    await tx.execute(sql`INSERT INTO schema_meta (seed_revision) VALUES (${BOOTSTRAP_REVISION})`);
  });
}
