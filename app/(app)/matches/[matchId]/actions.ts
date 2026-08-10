"use server";

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function sendMatchMessage(form: FormData) {
  const user = await requireUser();
  const matchId = String(form.get("matchId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) throw new Error("Message cannot be empty");

  const [match] = await db
    .select()
    .from(schema.matches)
    .where(
      and(
        eq(schema.matches.id, matchId),
        eq(schema.matches.status, "mutual"),
        or(
          eq(schema.matches.userAId, user.id),
          eq(schema.matches.userBId, user.id),
        ),
      ),
    )
    .limit(1);

  if (!match) throw new Error("Chat unlocks only after a mutual match");

  await db.insert(schema.matchMessages).values({
    matchId: match.id,
    senderUserId: user.id,
    body,
  });

  if (!match.firstConversationAt) {
    await db
      .update(schema.matches)
      .set({ firstConversationAt: new Date() })
      .where(eq(schema.matches.id, match.id));
  }

  revalidatePath(`/matches/${matchId}`);
}
