// scripts/seed-users.ts
//
// Ensures at least one admin exists (bootstrap). Safe to run on every deploy:
// if an admin or super_admin already exists, no admin is created.
//
// In development, also seeds optional fixed personas (explorer / elite / couple)
// when those emails are not already registered.
//
// Run: pnpm db:seed-users

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth/server";

type UserRole = (typeof schema.userRoleEnum.enumValues)[number];
type UserTier = (typeof schema.userTierEnum.enumValues)[number];
type UserMode = (typeof schema.userModeEnum.enumValues)[number];

const isProd = process.env.NODE_ENV === "production";

async function hasAdmin(): Promise<boolean> {
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      or(
        eq(schema.users.role, "admin"),
        eq(schema.users.role, "super_admin"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function userExists(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return Boolean(row);
}

async function createAuthUser(opts: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tier: UserTier;
  mode: UserMode;
}): Promise<void> {
  const email = opts.email.toLowerCase();
  if (await userExists(email)) {
    console.log(`  skip ${email} (already registered)`);
    return;
  }

  await auth.api.signUpEmail({
    body: {
      name: opts.name,
      email,
      password: opts.password,
      role: opts.role,
      tier: opts.tier,
      mode: opts.mode,
    },
  });

  await db
    .update(schema.users)
    .set({
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.email, email));

  console.log(`  created ${email} (${opts.role} / ${opts.tier} / ${opts.mode})`);
}

function resolveBootstrapAdmin(): {
  email: string;
  password: string;
  name: string;
} | null {
  const email =
    process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ||
    (isProd ? "" : "admin@evermore.local");
  const password =
    process.env.SEED_ADMIN_PASSWORD?.trim() ||
    (isProd ? "" : "ChangeMeDev123!");
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Evermore Admin";

  if (!email || !password) {
    if (isProd) {
      console.error(
        "No admin in database. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then run pnpm db:seed-users again.",
      );
      process.exit(1);
    }
    return null;
  }

  return { email, password, name };
}

async function bootstrapAdmin(): Promise<void> {
  if (await hasAdmin()) {
    console.log("Admin already exists — skipping bootstrap admin.");
    return;
  }

  const creds = resolveBootstrapAdmin();
  if (!creds) {
    console.log("No admin and bootstrap credentials not configured — skipping.");
    return;
  }

  console.log("No admin found — creating bootstrap super_admin…");
  await createAuthUser({
    name: creds.name,
    email: creds.email,
    password: creds.password,
    role: "super_admin",
    tier: "free",
    mode: "explorer",
  });
}

async function seedDevPersonas(): Promise<void> {
  if (isProd) {
    console.log("Skipping dev personas (NODE_ENV=production).");
    return;
  }

  const password =
    process.env.SEED_DEV_PASSWORD?.trim() || "ChangeMeDev123!";
  if (!process.env.SEED_DEV_PASSWORD) {
    console.log(
      "Using default dev password (ChangeMeDev123!). Set SEED_DEV_PASSWORD to override.",
    );
  }

  const personas: Array<{
    email: string;
    name: string;
    role: UserRole;
    tier: UserTier;
    mode: UserMode;
  }> = [
    {
      email:
        process.env.SEED_DEV_EXPLORER_EMAIL?.trim().toLowerCase() ||
        "explorer@evermore.local",
      name: "Dev Explorer",
      role: "user",
      tier: "explorer",
      mode: "explorer",
    },
    {
      email:
        process.env.SEED_DEV_ELITE_EMAIL?.trim().toLowerCase() ||
        "elite@evermore.local",
      name: "Dev Elite",
      role: "user",
      tier: "elite",
      mode: "elite",
    },
    {
      email:
        process.env.SEED_DEV_COUPLE_EMAIL?.trim().toLowerCase() ||
        "couple@evermore.local",
      name: "Dev Couple",
      role: "user",
      tier: "couple",
      mode: "couple",
    },
  ];

  console.log("Seeding dev personas (skip if email already exists)…");
  for (const p of personas) {
    await createAuthUser({ ...p, password });
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  await bootstrapAdmin();
  await seedDevPersonas();
  console.log("seed-users complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
