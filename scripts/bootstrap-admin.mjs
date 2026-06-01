// scripts/bootstrap-admin.mjs
//
// Ensures at least one super_admin exists. Safe to run on every deploy (the
// container entrypoint runs it after migrations): if an admin/super_admin
// already exists it is a no-op.
//
// Runs in the production standalone image, which only ships `postgres` and
// Node builtins (no tsx, no full app bundle). So instead of going through the
// Better Auth API it writes the user + credential account rows directly,
// reproducing Better Auth's scrypt hash format byte-for-byte
// (@better-auth/utils/password): `${saltHex}:${scryptKeyHex}`, NFKC-normalised
// password, salt is the 16-byte hex STRING, N=16384 r=16 p=1 dkLen=64.

import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import postgres from "postgres";

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 16384, r: 16, p: 1, dkLen: 64 };

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex"); // 32-char hex string, used as-is
  const key = await scrypt(password.normalize("NFKC"), salt, SCRYPT.dkLen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

const id = () => randomBytes(16).toString("hex");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[bootstrap-admin] DATABASE_URL is not set");
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Evermore Admin";

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [existingAdmin] = await sql`
      select id from users where role in ('admin', 'super_admin') limit 1
    `;
    if (existingAdmin) {
      console.log("[bootstrap-admin] admin already exists — skipping.");
      return;
    }

    if (!email || !password) {
      console.warn(
        "[bootstrap-admin] no admin found and SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — skipping (set them and redeploy).",
      );
      return;
    }

    // Promote an existing account with this email rather than duplicating it.
    const [existingUser] = await sql`select id from users where email = ${email} limit 1`;
    if (existingUser) {
      await sql`update users set role = 'super_admin', updated_at = now() where id = ${existingUser.id}`;
      console.log(`[bootstrap-admin] promoted existing user ${email} to super_admin.`);
      return;
    }

    const userId = id();
    const passwordHash = await hashPassword(password);
    await sql.begin(async (tx) => {
      await tx`
        insert into users (id, name, email, email_verified, role, tier, mode, banned, created_at, updated_at)
        values (${userId}, ${name}, ${email}, true, 'super_admin', 'free', 'explorer', false, now(), now())
      `;
      await tx`
        insert into accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
        values (${id()}, ${userId}, ${userId}, 'credential', ${passwordHash}, now(), now())
      `;
    });
    console.log(`[bootstrap-admin] created super_admin ${email}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[bootstrap-admin] failed:", err);
    process.exit(1);
  });
