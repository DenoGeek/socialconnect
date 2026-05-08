// scripts/migrate.mjs
//
// Applies pending Drizzle migrations from ./db/migrations against DATABASE_URL.
// Invoked by the container entrypoint before `node server.js` so the schema is
// up to date by the time the app accepts requests.
//
// Generate migration SQL locally with: pnpm db:generate
// Drizzle tracks applied migrations in the `__drizzle_migrations` table, so
// re-running on every boot is safe (and a no-op when nothing is pending).

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

const start = Date.now();
console.log("[migrate] applying migrations from ./db/migrations…");
try {
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log(`[migrate] up to date (${Date.now() - start}ms)`);
} catch (err) {
  console.error("[migrate] failed:", err);
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
