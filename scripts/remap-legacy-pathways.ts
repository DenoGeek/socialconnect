/**
 * One-time: map legacy tiers to Amari/Zahari pathways and approve existing members.
 * Run: pnpm tsx scripts/remap-legacy-pathways.ts
 */
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";

async function main() {
  await db
    .update(schema.users)
    .set({
      pathway: "zahari",
      vettingStatus: "approved",
      updatedAt: new Date(),
    })
    .where(inArray(schema.users.tier, ["elite", "concierge"]));

  await db
    .update(schema.users)
    .set({
      pathway: "amari",
      vettingStatus: "approved",
      updatedAt: new Date(),
    })
    .where(
      sql`${schema.users.tier} IN ('free', 'explorer', 'couple') AND ${schema.users.role} = 'user'`,
    );

  await db
    .update(schema.users)
    .set({ vettingStatus: "approved", updatedAt: new Date() })
    .where(
      inArray(schema.users.role, [
        "admin",
        "super_admin",
        "concierge",
        "facilitator",
        "host",
        "professional",
      ]),
    );

  const zahariUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.pathway, "zahari"));

  for (const u of zahariUsers) {
    const existing = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, u.id))
      .limit(1);
    if (!existing[0]) {
      await db.insert(schema.zahariEngagements).values({
        userId: u.id,
        status: "active",
        sovereignPaidAt: new Date(),
      });
    }
  }

  console.log("Legacy pathway remap complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
