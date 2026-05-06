import { and, eq } from "drizzle-orm";
import { inngest, type AppEvents } from "../client";
import { db } from "@/db";
import { impressions, matches } from "@/db/schema";

/**
 * When an impression is submitted, check whether the reverse impression exists.
 * If so, create a `matches` row in `pending_concierge` status.
 *
 * Pair canonicalization: store the lexically smaller user ID as user_a.
 */
export const detectMutualMatch = inngest.createFunction(
  {
    id: "detect-mutual-match",
    name: "Detect mutual match on impression submission",
    triggers: [{ event: "impression.submitted" }],
  },
  async ({ event, step }) => {
    const data = event.data as AppEvents["impression.submitted"];
    const { eventId, fromUserId, toUserId } = data;

    const reverse = await step.run("find-reverse-impression", async () => {
      const rows = await db
        .select()
        .from(impressions)
        .where(
          and(
            eq(impressions.eventId, eventId),
            eq(impressions.fromUserId, toUserId),
            eq(impressions.toUserId, fromUserId),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    });

    if (!reverse) return { matched: false };

    const userA = fromUserId < toUserId ? fromUserId : toUserId;
    const userB = fromUserId < toUserId ? toUserId : fromUserId;

    const created = await step.run("create-match", async () => {
      const existing = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.eventId, eventId),
            eq(matches.userAId, userA),
            eq(matches.userBId, userB),
          ),
        )
        .limit(1);
      if (existing[0]) return existing[0];

      const [row] = await db
        .insert(matches)
        .values({
          eventId,
          userAId: userA,
          userBId: userB,
          sourceImpressionAId: reverse.id,
          sourceImpressionBId: data.impressionId,
          status: "pending_concierge",
        })
        .returning();
      return row;
    });

    await step.sendEvent("notify-match-created", {
      name: "match.created",
      data: { matchId: created.id },
    });

    return { matched: true, matchId: created.id };
  },
);
