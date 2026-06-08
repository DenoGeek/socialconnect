"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { detectMutualMatch } from "@/lib/matching/match-loop";
import { isPairExcluded } from "@/lib/matching/exclusions";

export async function submitImpression(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get("eventId"));
  const toUserId = String(form.get("toUserId"));
  const likedReason = String(form.get("likedReason") ?? "") || null;

  if (toUserId === user.id) throw new Error("Cannot opt in on yourself");

  if (await isPairExcluded(user.id, toUserId)) {
    throw new Error("Match unavailable");
  }

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
