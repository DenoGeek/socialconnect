import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Pick a Date Vault deal for a new match, scored by:
 *   - shared interests (Nature, Food, etc.)
 *   - shared city / region (geographic centrality)
 *   - spending tier alignment
 *   - partner inventory check (active deal, not expired)
 *
 * Returns null if no good fit found.
 */
export async function suggestBridgeUpsell(matchId: string) {
  const [match] = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.id, matchId))
    .limit(1);
  if (!match) return null;

  const profiles = await db
    .select()
    .from(schema.profiles)
    .where(inArray(schema.profiles.userId, [match.userAId, match.userBId]));
  if (profiles.length !== 2) return null;
  const [pa, pb] = profiles;

  const sharedInterests = (pa.interests ?? []).filter((i) =>
    (pb.interests ?? []).includes(i),
  );
  const lowestSpendTier =
    pa.spendingTier === "elite" && pb.spendingTier === "elite"
      ? "elite"
      : pa.spendingTier === "premium" || pb.spendingTier === "premium"
        ? "premium"
        : "standard";

  // Inventory: active, non-expired deals matching vibe + tier.
  const now = new Date();
  const candidates = await db
    .select({
      deal: schema.dateVaultDeals,
      partner: schema.datePartners,
    })
    .from(schema.dateVaultDeals)
    .innerJoin(
      schema.datePartners,
      eq(schema.datePartners.id, schema.dateVaultDeals.partnerId),
    )
    .where(
      and(
        eq(schema.dateVaultDeals.active, true),
        eq(schema.datePartners.active, true),
        or(
          isNull(schema.dateVaultDeals.expiresAt),
          gt(schema.dateVaultDeals.expiresAt, now),
        ),
        eq(schema.dateVaultDeals.spendingTier, lowestSpendTier),
      ),
    );

  // Score: tag overlap with shared interests + same city bonus.
  let best: { dealId: string; reasoning: string } | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const overlap = (c.deal.vibeTags ?? []).filter((t) =>
      sharedInterests.some((i) => i.toLowerCase().includes(t.toLowerCase())),
    ).length;
    const sameCity = pa.city && pb.city && pa.city === pb.city && c.partner.city === pa.city ? 1 : 0;
    const score = overlap * 10 + sameCity * 5 + (c.partner.feedbackScore ?? 0);
    if (score > bestScore) {
      bestScore = score;
      best = {
        dealId: c.deal.id,
        reasoning: `Shared interests: ${sharedInterests.join(", ") || "—"} · spending tier: ${lowestSpendTier}`,
      };
    }
  }

  if (!best) return null;

  await db
    .insert(schema.matchBridgeUpsells)
    .values({
      matchId,
      dealId: best.dealId,
      reasoning: best.reasoning,
    });
  await db
    .update(schema.matches)
    .set({ bridgeUpsellSentAt: new Date() })
    .where(eq(schema.matches.id, matchId));
  return best.dealId;
}

/**
 * Retarget logic: 3 days after a match with no claim, suggest a *different* deal.
 */
export async function retargetIfStale() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const stale = await db
    .select()
    .from(schema.matchBridgeUpsells)
    .where(
      and(
        isNull(schema.matchBridgeUpsells.clickedAt),
        isNull(schema.matchBridgeUpsells.claimedAt),
        sql`${schema.matchBridgeUpsells.createdAt} < ${threeDaysAgo}`,
      ),
    );
  for (const row of stale) {
    if (row.retargetCount >= 1) continue;
    await db
      .update(schema.matchBridgeUpsells)
      .set({ retargetCount: row.retargetCount + 1 })
      .where(eq(schema.matchBridgeUpsells.id, row.id));
    // Add a second suggestion shifted to a different category.
    await suggestBridgeUpsell(row.matchId);
  }
}
