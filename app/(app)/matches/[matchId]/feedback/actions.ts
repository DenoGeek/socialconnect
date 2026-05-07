"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dateFeedback, matches } from "@/db/schema";
import { requireSession } from "@/lib/auth/server";

const schema = z.object({
  rating: z.enum(["great", "ok", "no_chemistry", "not_my_pace", "other"]),
  notes: z.string().max(2000).optional(),
});

export async function submitFeedback(matchId: string, formData: FormData) {
  const session = await requireSession();
  const userId = session.user.id;

  const parsed = schema.parse({
    rating: formData.get("rating"),
    notes: (formData.get("notes") as string) || undefined,
  });

  // Verify the user is part of this match (RLS-style check at the app layer).
  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        or(eq(matches.userAId, userId), eq(matches.userBId, userId)),
      ),
    )
    .limit(1);
  if (!match) throw new Error("Match not found");

  await db.insert(dateFeedback).values({
    matchId: match.id,
    fromUserId: userId,
    rating: parsed.rating,
    notes: parsed.notes,
  });

  revalidatePath(`/matches/${matchId}/feedback`);
  redirect(`/matches/${matchId}/feedback?saved=1`);
}
