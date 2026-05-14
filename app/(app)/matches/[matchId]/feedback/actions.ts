"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function saveFeedback(form: FormData) {
  const user = await requireUser();
  const matchId = String(form.get("matchId"));
  const rating = Number(form.get("rating") ?? 0) || null;
  const body = String(form.get("body") ?? "").trim();

  await db.insert(schema.matchFeedback).values({
    matchId,
    authorUserId: user.id,
    rating: rating ?? undefined,
    body: body || undefined,
  });

  // Mark first-conversation timestamp so Ghosting Mitigation knows.
  await db
    .update(schema.matches)
    .set({ firstConversationAt: new Date() })
    .where(eq(schema.matches.id, matchId));

  redirect(`/matches/${matchId}?feedback=saved`);
}
