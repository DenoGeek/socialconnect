import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export type OpenMatchCardEvent = {
  event: typeof schema.events.$inferSelect;
  closesAt: Date;
  impressionCount: number;
};

export async function getOpenMatchCardEvents(
  userId: string,
): Promise<OpenMatchCardEvent[]> {
  const purchases = await db
    .select({ event: schema.events })
    .from(schema.ticketPurchases)
    .innerJoin(
      schema.events,
      eq(schema.events.id, schema.ticketPurchases.eventId),
    )
    .where(
      and(
        eq(schema.ticketPurchases.userId, userId),
        inArray(schema.ticketPurchases.status, ["confirmed", "checked_in"]),
      ),
    );

  const now = new Date();
  const open: OpenMatchCardEvent[] = [];

  for (const { event } of purchases) {
    const closesAt = new Date(
      new Date(event.endsAt).getTime() +
        event.impressionDeadlineHours * 60 * 60 * 1000,
    );
    if (now >= closesAt) continue;

    const impressions = await db
      .select({ id: schema.impressions.id })
      .from(schema.impressions)
      .where(
        and(
          eq(schema.impressions.eventId, event.id),
          eq(schema.impressions.fromUserId, userId),
        ),
      );

    open.push({
      event,
      closesAt,
      impressionCount: impressions.length,
    });
  }

  return open.sort(
    (a, b) => a.closesAt.getTime() - b.closesAt.getTime(),
  );
}

export async function hasSubmittedMatchCard(
  userId: string,
  eventId?: string,
) {
  const rows = await db
    .select({ id: schema.impressions.id })
    .from(schema.impressions)
    .where(
      eventId
        ? and(
            eq(schema.impressions.fromUserId, userId),
            eq(schema.impressions.eventId, eventId),
          )
        : eq(schema.impressions.fromUserId, userId),
    )
    .limit(1);
  return rows.length > 0;
}
