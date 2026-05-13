# Evermore · Agano — Relationship Nervous System

A closed-loop relationship platform: **Discovery → Match → Covenant** plus Concierge, Residential, and a B2B Lab for facilitators. Kenya-first, M-Pesa native, architected to extend internationally.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Postgres on Neon · Drizzle ORM
- Better Auth (email/password + Google OAuth, role plugin)
- TinyPesa (M-Pesa STK Push) behind a swappable `PaymentProvider` interface
- Resend (email) · Africa's Talking (SMS) · WhatsApp (phase 2)
- Inngest (background jobs) · Cloudflare R2 (media)
- Tailwind 4 · shadcn/ui (to be added once brand tokens land)

See `/Users/makindu/.claude/plans/twinkly-singing-grove.md` for the full plan.

## Getting started

```bash
pnpm install
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_*, TINYPESA_*, RESEND_*, AT_*
pnpm db:push       # creates tables on the Neon database
pnpm dev
```

Open http://localhost:3003.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` across the project |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate SQL migrations from schema diffs |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev shortcut, no migration files) |
| `pnpm db:studio` | Drizzle Studio |

## Repository layout

```
app/
  (marketing) (auth) (app) (admin) (partner)    # Next.js route groups
  api/webhooks/tinypesa  api/inngest  api/auth/[...all]  api/qr/[ticketId]
db/
  schema/      identity, alias, events, matches, concierge,
               programs, residential, professionals, payments, audit
lib/
  auth/        Better Auth instance + server/client helpers
  payments/    PaymentProvider interface + TinyPesaProvider
  notifications/ email · sms · whatsapp (stub)
  alias/       per-event alias assignment (idempotent, race-safe)
inngest/
  client.ts + functions/  background jobs
components/
  ui/  brand/
```

## Foundation exit criteria

A clean build hits these before product tracks open:

- [ ] User signs up with Google, profile row created, role = `user`
- [ ] Admin can hit `/admin`; non-admin redirected to `/`
- [ ] TinyPesa sandbox STK Push completes; `payments` row written; webhook signature verified
- [ ] Inngest dev server picks up `assignAliasOnPurchase` and `detectMutualMatch`

# socialconnect
