// scripts/promote-admin.mjs
//
// Promote an existing user to role='admin'. Run after the user has signed up
// through the regular /register flow (the regular signup creates the users
// row + better-auth account row with hashed password — no need to re-implement
// scrypt here).
//
// Usage from the running container:
//   docker compose exec web sh -c 'ADMIN_EMAIL=you@example.com node scripts/promote-admin.mjs'
//
// Or in Dokploy's terminal for the web service:
//   ADMIN_EMAIL=you@example.com node scripts/promote-admin.mjs
//
// Idempotent: re-running on an already-admin user is a no-op.

import postgres from "postgres";

const url = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL;

if (!url) {
  console.error("[promote-admin] DATABASE_URL is not set");
  process.exit(1);
}
if (!email) {
  console.error("[promote-admin] ADMIN_EMAIL is not set");
  console.error("  example: ADMIN_EMAIL=you@example.com node scripts/promote-admin.mjs");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });

try {
  const rows = await client`
    UPDATE users
       SET role = 'admin', updated_at = now()
     WHERE email = ${email}
     RETURNING id, email, role
  `;

  if (rows.length === 0) {
    console.error(`[promote-admin] no user found with email "${email}"`);
    console.error("  sign up at /register first, then re-run this script.");
    process.exit(2);
  }

  const [u] = rows;
  console.log(`[promote-admin] ${u.email} (${u.id}) is now ${u.role}`);
} catch (err) {
  console.error("[promote-admin] failed:", err);
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
