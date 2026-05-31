# Dokploy deployment checklist

## Environment (Dokploy → Project → Environment)

Set these at **runtime** (Dokploy `.env` next to `docker-compose-dokploy.yml`):

| Variable | Example (production) |
|----------|----------------------|
| `DATABASE_URL` | Neon / Postgres connection string |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://socialconnect.neverest.co.ke` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as `BETTER_AUTH_URL` |
| `SEED_ADMIN_EMAIL` | Bootstrap admin if none exists |
| `SEED_ADMIN_PASSWORD` | Strong password (required in production) |

**Do not** point auth URLs at `localhost`, `0.0.0.0`, or port `3002` — cookies and sessions will fail.

## GitHub Actions build secret `PROD_UI_ENV`

The image build in `.github/workflows/deploy.yml` copies `secrets.PROD_UI_ENV` into `.env` **before** `docker build`. Any `NEXT_PUBLIC_*` values are baked into the client bundle.

Your `PROD_UI_ENV` should include at minimum:

```env
NEXT_PUBLIC_BETTER_AUTH_URL=https://socialconnect.neverest.co.ke
NEXT_PUBLIC_APP_NAME=Evermore
```

Rebuild and redeploy after changing `PROD_UI_ENV`.

## First deploy / migrations / admin

Container start command (see `docker-compose-dokploy.yml`):

```bash
node scripts/migrate.mjs && node server.js
```

After a fresh database:

```bash
docker exec -it <container> sh -c "node --import tsx scripts/seed-users.mjs"
```

Or run `pnpm db:seed-users` locally against production `DATABASE_URL` (careful).

## How to see how many users you have

1. **Admin dashboard (in the app)**  
   Sign in as `admin` / `super_admin` → open **`/admin`**.  
   The **Command** dashboard shows **total users** (count from the `users` table).

2. **Admin user list**  
   **`/admin/users`** — searchable list of all accounts.

3. **Database**  
   In Dokploy, open your Postgres service or Drizzle Studio against `DATABASE_URL`:

   ```sql
   SELECT COUNT(*) FROM users;
   SELECT tier, COUNT(*) FROM users GROUP BY tier;
   ```

4. **Dokploy UI**  
   Dokploy does not show app user counts by default — use the app admin or SQL above.

## Membership tiers (M-Pesa)

| Plan | Price (KES) | DB tier |
|------|-------------|---------|
| Standard | 1,000 | `explorer` |
| Premium | 5,000 | `couple` |
| Elite | 10,000 | `elite` |

Users upgrade at **`/profile/membership`**. Webhook must confirm TinyPesa payments for tier to apply.
