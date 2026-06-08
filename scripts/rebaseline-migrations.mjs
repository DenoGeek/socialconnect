// scripts/rebaseline-migrations.mjs
//
// Reconciles the Drizzle migration ledger (drizzle.__drizzle_migrations) with
// the migration files currently on disk.
//
// Why this exists:
//   Drizzle decides what to run by comparing each file's journal `when` value
//   against the newest `created_at` row in drizzle.__drizzle_migrations. When
//   migration files are rewritten/squashed *after* a database was already
//   migrated (as happened here — see git history of db/migrations/meta/
//   _journal.json), the ledger and the files drift apart. The migrator then
//   either skips a migration it should run or errors trying to re-apply one,
//   and new columns (e.g. users.pathway) never land. The symptom is
//   `column "pathway" does not exist` on every Better Auth session lookup.
//
// What it does (idempotent):
//   1. Ensures drizzle.__drizzle_migrations exists (same DDL the migrator uses).
//   2. For each migration in ./db/migrations/meta/_journal.json, computes the
//      drizzle-compatible hash (sha256 of the raw .sql file) and INSERTS a
//      ledger row if one with that hash is missing.
//   3. Prints any *stale* ledger rows (hashes not matching any current file).
//      Pass --prune to delete them so the ledger exactly mirrors the files.
//
// Safety:
//   Before baselining a migration, this refuses to mark it applied unless its
//   schema is actually present. Right now that means: it will not insert the
//   0001_agano_pathways row unless users.pathway exists. Run the recovery SQL
//   (scripts/sql/recover-0001-idempotent.sql) FIRST, then this — otherwise you
//   would tell Drizzle the column exists when it does not, making the breakage
//   permanent.
//
// Usage:
//   node scripts/rebaseline-migrations.mjs            # reconcile (safe)
//   node scripts/rebaseline-migrations.mjs --prune    # also drop stale rows
//   node scripts/rebaseline-migrations.mjs --dry-run  # report only, no writes

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

const PRUNE = process.argv.includes("--prune");
const DRY_RUN = process.argv.includes("--dry-run");

// Schema presence guards. A migration is only baselined if its guard passes,
// so we never record a migration as applied when its effects are missing.
// Keyed by journal tag. Tags with no entry are baselined unconditionally.
const GUARDS = {
  "0001_agano_pathways": {
    sql: `select 1 from information_schema.columns
            where table_name = 'users' and column_name = 'pathway' limit 1`,
    missing:
      "users.pathway is missing — run scripts/sql/recover-0001-idempotent.sql first, then re-run this script.",
  },
};

function loadMigrations() {
  const journalPath = "./db/migrations/meta/_journal.json";
  if (!existsSync(journalPath)) {
    console.error(`[rebaseline] ${journalPath} not found — run from the repo root.`);
    process.exit(1);
  }
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  return journal.entries.map((entry) => {
    const sqlPath = `./db/migrations/${entry.tag}.sql`;
    const query = readFileSync(sqlPath, "utf8");
    // Matches drizzle-orm's readMigrationFiles: sha256 of the raw file text.
    const hash = createHash("sha256").update(query).digest("hex");
    return { tag: entry.tag, folderMillis: entry.when, hash };
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[rebaseline] DATABASE_URL is not set");
    process.exit(1);
  }

  const migrations = loadMigrations();
  // Silence "already exists, skipping" NOTICEs from the IF NOT EXISTS DDL below.
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

  try {
    // Same table the migrator manages.
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await sql.unsafe(
      `CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
         "id" SERIAL PRIMARY KEY,
         "hash" text NOT NULL,
         "created_at" bigint
       )`,
    );

    const existing = await sql`
      select id, hash, created_at from "drizzle"."__drizzle_migrations"
    `;
    const existingHashes = new Set(existing.map((r) => r.hash));
    const fileHashes = new Set(migrations.map((m) => m.hash));

    console.log(`[rebaseline] ${migrations.length} migration file(s) on disk, ${existing.length} ledger row(s).`);

    // 1) Insert any missing migrations (subject to schema guards).
    for (const m of migrations) {
      if (existingHashes.has(m.hash)) {
        console.log(`[rebaseline] ✓ ${m.tag} already in ledger.`);
        continue;
      }

      const guard = GUARDS[m.tag];
      if (guard) {
        const [present] = await sql.unsafe(guard.sql);
        if (!present) {
          console.error(`[rebaseline] ✗ refusing to baseline ${m.tag}: ${guard.missing}`);
          process.exitCode = 1;
          continue;
        }
      }

      if (DRY_RUN) {
        console.log(`[rebaseline] [dry-run] would insert ${m.tag} (created_at=${m.folderMillis}).`);
        continue;
      }

      await sql`
        insert into "drizzle"."__drizzle_migrations" ("hash", "created_at")
        values (${m.hash}, ${m.folderMillis})
      `;
      console.log(`[rebaseline] + inserted ${m.tag} (created_at=${m.folderMillis}).`);
    }

    // 2) Report (and optionally prune) stale rows left over from rewritten files.
    const stale = existing.filter((r) => !fileHashes.has(r.hash));
    if (stale.length) {
      console.log(`[rebaseline] ${stale.length} stale ledger row(s) not matching any current file:`);
      for (const r of stale) console.log(`             id=${r.id} hash=${r.hash} created_at=${r.created_at}`);
      if (PRUNE && !DRY_RUN) {
        const ids = stale.map((r) => r.id);
        await sql`delete from "drizzle"."__drizzle_migrations" where id = any(${ids})`;
        console.log(`[rebaseline] - pruned ${stale.length} stale row(s).`);
      } else {
        console.log("[rebaseline]   (pass --prune to delete them so the ledger mirrors the files)");
      }
    }

    // 3) Final sanity: the newest created_at must be >= the newest file's `when`
    //    or the next migrate() boot will try to re-run things.
    const [{ max_created } = {}] = await sql`
      select max(created_at) as max_created from "drizzle"."__drizzle_migrations"
    `;
    const newestFile = Math.max(...migrations.map((m) => m.folderMillis));
    if (max_created != null && Number(max_created) >= newestFile) {
      console.log(`[rebaseline] ledger head ${max_created} >= newest file ${newestFile} — future migrate() boots are clean no-ops.`);
    } else {
      console.warn(`[rebaseline] ledger head ${max_created} < newest file ${newestFile} — migrate() will still attempt pending migrations.`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error("[rebaseline] failed:", err);
    process.exit(1);
  });
