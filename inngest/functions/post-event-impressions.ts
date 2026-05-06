import { inngest, type AppEvents } from "../client";

/**
 * Opens the post-event Impression Form once an event ends.
 * Plan C2: scheduled X hours after the event end timestamp.
 *
 * Implementation will:
 *   - Mark the event as `completed`
 *   - Notify each attendee (email + SMS) with a link to /matches/impressions/[eventId]
 *   - Set a deadline timer that closes the form after 7 days.
 *
 * Stub for now — wired up so the event channel exists.
 */
export const postEventImpressions = inngest.createFunction(
  {
    id: "post-event-impressions",
    name: "Open post-event Impression Forms",
    triggers: [{ event: "event.ended" }],
  },
  async ({ event, step }) => {
    const data = event.data as AppEvents["event.ended"];
    await step.sleep("settle-window", "2h");
    // TODO: query attendees, send notifications, write impression-form open events
    return { eventId: data.eventId, opened: true };
  },
);
