"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { detectMutualMatch } from "@/lib/matching/match-loop";

export async function submitImpression(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get("eventId"));
  const toUserId = String(form.get("toUserId"));
  const likedReason = String(form.get("likedReason") ?? "") || null;

  if (toUserId === user.id) throw new Error("Cannot opt in on yourself");

  // Exclusion check: e.g. ex-partners or de-synced couples.
  const excluded = await db
    .select()
    .from(schema.matchExclusions)
    .where(
      and(
        eq(schema.matchExclusions.userAId, user.id),
        eq(schema.matchExclusions.userBId, toUserId),
      ),
    )
    .limit(1);
  if (excluded[0]) throw new Error("Match unavailable");

  await db
    .insert(schema.impressions)
    .values({
      eventId,
      fromUserId: user.id,
      toUserId,
      likedReason: likedReason ?? undefined,
    })
    .onConflictDoNothing();

  // Compute mutual match.
  await detectMutualMatch({ eventId, userAId: user.id, userBId: toUserId });

  revalidatePath(`/matches`);
}
