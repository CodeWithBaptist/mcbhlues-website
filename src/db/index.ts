import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { SCHEMA_DDL } from "./ddl";
import { seedDatabase } from "./seed";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __mcbhluesDb?: Promise<Database>;
};

function usingRealPostgres(url: string | undefined): url is string {
  if (!url) return false;
  // The preview sandbox injects a placeholder URL; fall back to the embedded
  // PGlite database in that case so the portal still runs against real SQL.
  return !url.includes("dummy");
}

async function createDatabase(): Promise<Database> {
  const url = process.env.DATABASE_URL;
  let db: Database;
  let exec: (sql: string) => Promise<unknown>;

  if (usingRealPostgres(url)) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
    exec = (statement: string) => pool.query(statement);
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir = process.env.PGLITE_DATA_DIR ?? "./.data/pgdata";
    const { mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    mkdirSync(dirname(dataDir), { recursive: true });
    const client = new PGlite(dataDir);
    db = drizzle(client, { schema }) as unknown as Database;
    exec = (statement: string) => client.exec(statement);
  }

  // Idempotent DDL — safe on every boot.
  for (const statement of SCHEMA_DDL.split(";\n")) {
    const trimmed = statement.trim();
    if (trimmed) await exec(`${trimmed};`);
  }

  await seedDatabase(db);
  return db;
}

/**
 * Lazily initialised database handle. Every server-side caller must await this
 * rather than importing a raw client, which guarantees the RBAC tables exist
 * before any permission check runs.
 */
export function getDb(): Promise<Database> {
  globalForDb.__mcbhluesDb ??= createDatabase().catch((error) => {
    // Never cache a failed bootstrap — the next request retries cleanly.
    globalForDb.__mcbhluesDb = undefined;
    throw error;
  });
  return globalForDb.__mcbhluesDb;
}

export { schema };
