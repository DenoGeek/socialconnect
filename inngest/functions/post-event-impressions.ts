import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { inngest } from "../client";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

// Reminder 24h before the impression window closes.
export const postEventImpressionsNudge = inngest.createFunction(
  {
    id: "post-event-impressions-nudge",
    triggers: [{ cron: "0 * * * *" }],
  },
  async () => {
    const ended = await db
      .select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.status, "completed"),
          lt(schema.events.endsAt, new Date()),
        ),
      );
    for (const e of ended) {
      const attendees = await db
        .select({
          assignment: schema.aliasAssignments,
          profile: schema.profiles,
        })
        .from(schema.aliasAssignments)
        .innerJoin(
          schema.profiles,
          eq(schema.profiles.userId, schema.aliasAssignments.userId),
        )
        .where(eq(schema.aliasAssignments.eventId, e.id));
      for (const a of attendees) {
        if (!a.profile.phone) continue;
        await sendWhatsApp({
          to: a.profile.phone,
          body: `Evermore: you have ~24h to submit your impressions from ${e.title}.`,
        });
      }
    }
  },
);
