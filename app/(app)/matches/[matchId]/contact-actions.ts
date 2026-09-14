"use server";

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function shareContactWithMatch(form: FormData) {
  const user = await requireUser();
  const matchId = String(form.get("matchId"));

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
  if (!match) throw new Error("Match not found");

  const isA = match.userAId === user.id;
  let [exchange] = await db
    .select()
    .from(schema.matchContactExchanges)
    .where(eq(schema.matchContactExchanges.matchId, matchId))
    .limit(1);

  if (!exchange) {
    [exchange] = await db
      .insert(schema.matchContactExchanges)
      .values({
        matchId,
        userASharedAt: isA ? new Date() : null,
        userBSharedAt: isA ? null : new Date(),
      })
      .returning();
  } else {
    await db
      .update(schema.matchContactExchanges)
      .set(
        isA
          ? { userASharedAt: new Date() }
          : { userBSharedAt: new Date() },
      )
      .where(eq(schema.matchContactExchanges.id, exchange.id));
  }

  revalidatePath(`/matches/${matchId}`);
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await db
    .update(schema.inAppNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.inAppNotifications.userId, user.id),
      ),
    );
  revalidatePath("/notifications");
}
