import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Assign a unique alias to a user for a specific event.
 *
 * Guarantees:
 * - No two users at the same event share an alias (unique partial across event).
 * - If the user already has an alias for this event, returns it (idempotent).
 * - If the user has been pinned (manual override), reuses it across events.
 */
export async function assignAlias(opts: {
  userId: string;
  eventId: string | null;
  forceAliasId?: string;
}) {
  const { userId, eventId, forceAliasId } = opts;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user || user.vettingStatus !== "approved") {
    throw new Error("Member not approved for alias assignment");
  }
  if (user.pathway === "zahari") {
    throw new Error("Zahari members remain digitally invisible at events");
  }
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);
  if (!profile?.onboardingCompletedAt) {
    throw new Error("Complete onboarding before receiving an alias");
  }

  // Idempotency: existing assignment for this (user, event).
  const [existing] = await db
    .select()
    .from(schema.aliasAssignments)
    .where(
      and(
        eq(schema.aliasAssignments.userId, userId),
        eventId
          ? eq(schema.aliasAssignments.eventId, eventId)
          : isNull(schema.aliasAssignments.eventId),
      ),
    )
    .limit(1);
  if (existing) return existing;

  // Pinned alias for this user → reuse across events.
  if (!forceAliasId) {
    const [pinned] = await db
      .select()
      .from(schema.aliasAssignments)
      .where(
        and(
          eq(schema.aliasAssignments.userId, userId),
          eq(schema.aliasAssignments.pinned, true),
        ),
      )
      .limit(1);
    if (pinned && eventId) {
      // Confirm not already taken at this event.
      const [conflict] = await db
        .select()
        .from(schema.aliasAssignments)
        .where(
          and(
            eq(schema.aliasAssignments.eventId, eventId),
            eq(schema.aliasAssignments.aliasId, pinned.aliasId),
          ),
        )
        .limit(1);
      if (!conflict) {
        const [row] = await db
          .insert(schema.aliasAssignments)
          .values({
            userId,
            eventId,
            aliasId: pinned.aliasId,
            mode: "auto",
            pinned: false,
          })
          .returning();
        return row;
      }
    }
  }

  let aliasId = forceAliasId ?? null;

  if (!aliasId) {
    // Find a free alias not already used at this event.
    const takenForEvent = eventId
      ? db
          .select({ id: schema.aliasAssignments.aliasId })
          .from(schema.aliasAssignments)
          .where(eq(schema.aliasAssignments.eventId, eventId))
      : db
          .select({ id: schema.aliasAssignments.aliasId })
          .from(schema.aliasAssignments)
          .where(sql`false`);
    const candidates = await db
      .select()
      .from(schema.aliasPool)
      .where(
        and(
          eq(schema.aliasPool.active, true),
          notInArray(schema.aliasPool.id, takenForEvent),
        ),
      )
      .orderBy(sql`random()`)
      .limit(1);
    if (!candidates[0]) {
      throw new Error(
        "Alias pool exhausted for this event — admin must add more aliases.",
      );
    }
    aliasId = candidates[0].id;
  }

  const [row] = await db
    .insert(schema.aliasAssignments)
    .values({ userId, eventId, aliasId, mode: "auto" })
    .returning();
  return row;
}

export async function getAlias(userId: string, eventId: string | null) {
  const rows = await db
    .select({
      assignment: schema.aliasAssignments,
      alias: schema.aliasPool,
    })
    .from(schema.aliasAssignments)
    .innerJoin(
      schema.aliasPool,
      eq(schema.aliasPool.id, schema.aliasAssignments.aliasId),
    )
    .where(
      and(
        eq(schema.aliasAssignments.userId, userId),
        eventId
          ? eq(schema.aliasAssignments.eventId, eventId)
          : isNull(schema.aliasAssignments.eventId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
