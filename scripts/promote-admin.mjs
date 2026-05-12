// scripts/promote-admin.mjs
//
// Promote a user (by email) to admin / super_admin / facilitator role.
// Usage: node scripts/promote-admin.mjs hello@you.com super_admin

import "dotenv/config";
import postgres from "postgres";

const [, , email, role = "admin"] = process.argv;
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email> [role]");
  process.exit(1);
}
const allowed = [
  "user",
  "concierge",
  "admin",
  "super_admin",
  "facilitator",
  "host",
  "professional",
];
if (!allowed.includes(role)) {
  console.error(`role must be one of: ${allowed.join(", ")}`);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: false });
const rows = await sql`UPDATE users SET role = ${role}::user_role WHERE email = ${email} RETURNING id, email, role`;
if (rows.length === 0) {
  console.error(`No user with email ${email}`);
  process.exit(2);
}
console.log(`Promoted ${rows[0].email} → ${rows[0].role}`);
await sql.end();
