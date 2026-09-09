import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit reads migrations / generates SQL from the real database.
 * The connection string comes from DATABASE_URL (loaded from .env.local by
 * dotenv) — never hardcode production credentials here.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
