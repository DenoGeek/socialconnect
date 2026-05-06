import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { aliasAssignments, aliasPool } from "@/db/schema";

/**
 * Assign a per-event Alias to a user. Idempotent and concurrency-safe.
 *
 * Algorithm:
 *  1) If (eventId, userId) already has an assignment, return it.
 *  2) Otherwise, pick an active pool entry NOT yet used at this event.
 *  3) Insert into alias_assignments inside a transaction; the unique index
 *     on (eventId, aliasId) makes a colliding insert fail, in which case we
 *     retry up to N times.
 *
 * Returns the assignment row.
 */
export async function assignAlias(eventId: string, userId: string, attempts = 5) {
  const existing = await db
    .select()
    .from(aliasAssignments)
    .where(and(eq(aliasAssignments.eventId, eventId), eq(aliasAssignments.userId, userId)))
    .limit(1);
  if (existing.length > 0) return existing[0];

  for (let i = 0; i < attempts; i++) {
    // Pick a random active alias not yet taken at this event.
    const taken = db
      .select({ id: aliasAssignments.aliasId })
      .from(aliasAssignments)
      .where(eq(aliasAssignments.eventId, eventId));

    const candidates = await db
      .select()
      .from(aliasPool)
      .where(and(eq(aliasPool.active, true), notInArray(aliasPool.id, taken)))
      .orderBy(sql`random()`)
      .limit(1);

    if (candidates.length === 0) {
      throw new Error(`Alias pool exhausted for event ${eventId}`);
    }

    try {
      const [row] = await db
        .insert(aliasAssignments)
        .values({ eventId, userId, aliasId: candidates[0].id })
        .returning();
      return row;
    } catch (err) {
      // Unique constraint race — another concurrent assignment took the same alias.
      // Retry with a fresh pick.
      if (i === attempts - 1) throw err;
    }
  }

  throw new Error(`Could not assign alias after ${attempts} attempts`);
}
