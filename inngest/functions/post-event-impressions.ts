import { and, eq, inArray } from "drizzle-orm";
import { inngest, type AppEvents } from "../client";
import { db } from "@/db";
import { events, ticketPurchases, users } from "@/db/schema";
import { assignAlias } from "@/lib/alias/assign";
import { sendEmail } from "@/lib/notifications/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * When an event ends, open the post-event Impression Form for attendees.
 *
 *  1) Backstop: ensure every paid attendee has an alias for this event.
 *  2) Email each attendee with a link to /matches/impressions/[eventSlug].
 *
 * Idempotent: re-running this function is safe — alias assignment is
 * idempotent and the email tracker (TODO) will dedupe sends in v2.
 */
export const postEventImpressions = inngest.createFunction(
  {
    id: "post-event-impressions",
    name: "Open post-event Impression Forms",
    triggers: [{ event: "event.ended" }],
  },
  async ({ event, step }) => {
    const { eventId } = event.data as AppEvents["event.ended"];

    const ev = await step.run("load-event", async () => {
      const [row] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      if (!row) throw new Error(`Event ${eventId} not found`);
      return row;
    });

    const attendees = await step.run("load-attendees", async () => {
      return db
        .select({
          userId: ticketPurchases.userId,
          email: users.email,
          name: users.name,
        })
        .from(ticketPurchases)
        .innerJoin(users, eq(users.id, ticketPurchases.userId))
        .where(
          and(
            eq(ticketPurchases.eventId, eventId),
            inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
          ),
        );
    });

    if (attendees.length === 0) {
      return { eventId, attendees: 0, emailed: 0 };
    }

    await step.run("backstop-alias-assignments", async () => {
      for (const a of attendees) {
        try {
          await assignAlias(eventId, a.userId);
        } catch {
          // pool exhaustion or race — not fatal here; admin can intervene.
        }
      }
    });

    const sent = await step.run("notify-attendees", async () => {
      const link = `${APP_URL}/matches/impressions/${ev.slug}`;
      let count = 0;
      for (const a of attendees) {
        try {
          await sendEmail({
            to: a.email,
            subject: `Your impressions for ${ev.title}`,
            html: impressionEmail({ name: a.name, eventTitle: ev.title, link }),
          });
          count++;
        } catch {
          // Skip individual failures; aggregator can retry by re-firing.
        }
      }
      return count;
    });

    return { eventId, attendees: attendees.length, emailed: sent };
  },
);

function impressionEmail({
  name,
  eventTitle,
  link,
}: {
  name: string;
  eventTitle: string;
  link: string;
}): string {
  const first = name.split(" ")[0];
  return `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui,sans-serif;background:#fafaf9;color:#1c1917;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;">
    <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#78716c;margin:0;">Evermore · Agano</p>
    <h1 style="font-size:22px;font-weight:600;margin:16px 0 8px;">A few quiet minutes, ${first}.</h1>
    <p style="line-height:1.6;color:#44403c;">
      Thanks for being part of <strong>${eventTitle}</strong>. Now we ask you to leave your
      impressions — who you connected with, what stayed with you. Only you and the Concierge will
      ever see your notes; the people you mention only learn anything if they mention you back.
    </p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:#1c1917;color:#fafaf9;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:500;">
        Leave your impressions
      </a>
    </p>
    <p style="font-size:13px;color:#78716c;line-height:1.6;">
      The form stays open for seven days. Take your time.
    </p>
  </div>
</body></html>`;
}
