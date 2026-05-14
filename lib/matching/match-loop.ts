import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { scoreCompatibility } from "./engine";
import { suggestBridgeUpsell } from "./bridge-upsell";
import { notifyMutualMatch } from "@/lib/notifications";

export async function detectMutualMatch(opts: {
  eventId: string | null;
  userAId: string;
  userBId: string;
}) {
  const { eventId, userAId, userBId } = opts;

  // Check both directions.
  const reciprocal = await db
    .select()
    .from(schema.impressions)
    .where(
      and(
        eventId
          ? eq(schema.impressions.eventId, eventId)
          : eq(schema.impressions.eventId, ""),
        eq(schema.impressions.fromUserId, userBId),
        eq(schema.impressions.toUserId, userAId),
      ),
    )
    .limit(1);
  if (!reciprocal[0]) return null;

  // Already matched?
  const existing = await db
    .select()
    .from(schema.matches)
    .where(
      and(
        eventId
          ? eq(schema.matches.eventId, eventId)
          : eq(schema.matches.eventId, ""),
        or(
          and(
            eq(schema.matches.userAId, userAId),
            eq(schema.matches.userBId, userBId),
          ),
          and(
            eq(schema.matches.userAId, userBId),
            eq(schema.matches.userBId, userAId),
          ),
        ),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];

  const compat = await scoreCompatibility(userAId, userBId);

  const [m] = await db
    .insert(schema.matches)
    .values({
      eventId: eventId ?? undefined,
      userAId,
      userBId,
      status: "mutual",
      compatibilityScore: compat.score,
      sharedIntents: compat.sharedIntents,
      matchedAt: new Date(),
    })
    .returning();

  // Fire bridge upsell + notifications (don't await failures).
  try {
    await suggestBridgeUpsell(m.id);
  } catch {}
  try {
    await notifyMutualMatch({
      matchId: m.id,
      userIds: [userAId, userBId],
    });
  } catch {}

  return m;
}
