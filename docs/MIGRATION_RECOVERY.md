# Migration recovery runbook

## Symptom

Every authenticated request 500s with `FAILED_TO_GET_SESSION`, and the Postgres
logs show:

```
column "pathway" does not exist  (SQLSTATE 42703)
```

Better Auth's user model selects `pathway` / `vetting_status` on every session
lookup, so a database missing those columns takes down the whole app.

## Root cause

The columns are added by migration `0001_agano_pathways`. The deployed database
never got that migration applied because the migration files were **rewritten
after the DB was already migrated** (`c511b83` squashed three migrations into a
new `0000_*`; `18813e2` added `0001_*`). Drizzle decides what to run by comparing
each file's journal `when` against the newest `created_at` in
`drizzle.__drizzle_migrations`; once the files and ledger drift apart, the
migrator skips or fails the migration and `pathway` never lands.

## Recovery (run once against the affected database)

From the repo root, with `DATABASE_URL` pointing at the affected DB:

```bash
# 1. Apply the missing 0001 effects (idempotent — safe to re-run).
psql "$DATABASE_URL" -f scripts/sql/recover-0001-idempotent.sql

# 2. Reconcile the Drizzle ledger so future deploys are clean no-ops.
#    Refuses to baseline 0001 unless users.pathway actually exists.
node scripts/rebaseline-migrations.mjs --prune

# 3. Restart the app. The entrypoint's `node scripts/migrate.mjs` is now a no-op.
```

Inside the production image (which ships `postgres` + Node only, no psql), run
step 1 via the bundled client instead, or run the equivalent through
`migrate.mjs` (see below).

## Why this can't silently recur

The migration files (`0000_*`, `0001_*`) are now **fully idempotent**:
`CREATE TABLE/INDEX IF NOT EXISTS`, and `CREATE TYPE` / `ADD CONSTRAINT` wrapped
in `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;`. So even if the
ledger is wrong and the migrator re-runs them, they apply as no-ops instead of
crash-looping the container. After `rebaseline-migrations.mjs`, the ledger head
is `>=` the newest file's `when`, so `migrate.mjs` is a clean no-op.

## Verified

The full flow (apply `0000` → drop `pathway` to mimic prod → recovery SQL →
rebaseline → `migrate.mjs` no-op, plus the self-healing path where the hardened
migrator re-applies `0001` on its own) was tested against a throwaway Postgres 16
container. Recovery SQL and rebaseline are both idempotent on re-run, and the
rebaseline guard correctly refuses to baseline `0001` while `users.pathway` is
absent.

## Going forward

Do **not** rewrite or squash migration files that have already been applied to an
environment — add a new forward migration instead. Rewriting is exactly what
desynced the ledger here.
