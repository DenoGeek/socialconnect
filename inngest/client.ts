import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "evermore",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type EvermoreEvents = {
  "ticket.purchased": { data: { ticketPurchaseId: string; userId: string; eventId: string } };
  "match.created": { data: { matchId: string } };
  "match.stale": { data: { matchId: string } };
  "installment.due-soon": { data: { installmentId: string } };
  "event.ended": { data: { eventId: string } };
};
