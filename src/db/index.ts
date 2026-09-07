import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { bootstrapDatabase } from "./bootstrap";

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
  let close: () => Promise<void>;
  let multiStatement = false;

  if (usingRealPostgres(url)) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    // Serverless-tuned pool: a modest cap keeps headroom on shared Postgres,
    // TCP keep-alive lets idle instances reuse a warm connection instead of
    // re-handshaking, and the timeout fails fast rather than hanging a render
    // when the database is unreachable.
    const pool = new Pool({
      connectionString: url,
      max: 10,
      keepAlive: true,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    db = drizzle(pool, { schema });
    close = () => pool.end();
    // Parameterless queries travel over PostgreSQL's simple query protocol,
    // which executes a whole script in one round trip.
    multiStatement = true;
  } else {
    // Serverless filesystems are read-only and ephemeral, so the embedded
    // database would silently lose every staff account between requests.
    // Runtime requests keep this hard requirement (the prerender pass of
    // `next build` and the ALLOW_PGLITE_FALLBACK escape hatch are the only
    // exceptions): build-time pages generate shell HTML that the edge
    // revalidates against the real database shortly after deploy.
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build" &&
      process.env.ALLOW_PGLITE_FALLBACK !== "true"
    ) {
      throw new Error(
        "DATABASE_URL is required in production. The Staff Portal stores staff " +
          "accounts, roles, permissions and audit logs in PostgreSQL — point " +
          "DATABASE_URL at a managed Postgres instance (Neon, Supabase, RDS, …)."
      );
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir = process.env.PGLITE_DATA_DIR ?? "./.data/pgdata";
    const { mkdirSync } = await import("fs");
    const { dirname } = await import("path");
    mkdirSync(dirname(dataDir), { recursive: true });
    const client = new PGlite(dataDir);
    db = drizzle(client, { schema }) as unknown as Database;
    close = () => client.close();
  }

  try {
    await bootstrapDatabase(db, { multiStatement });
    return db;
  } catch (error) {
    // getDb retries a failed bootstrap. Release this attempt's client/pool so
    // repeated failures cannot leak connections or keep the embedded DB open.
    await close().catch(() => undefined);
    throw error;
  }
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
