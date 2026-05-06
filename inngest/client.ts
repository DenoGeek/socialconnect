import { Inngest } from "inngest";

// Event payload types for handlers. Cast at send-site via `inngest.send({ name, data })`.
export type AppEvents = {
  "ticket.purchased": { userId: string; eventId: string; ticketPurchaseId: string };
  "event.ended": { eventId: string };
  "impression.submitted": {
    eventId: string;
    fromUserId: string;
    toUserId: string;
    impressionId: string;
  };
  "match.created": { matchId: string };
  "payment.settled": {
    paymentId: string;
    purpose: string;
    purposeRef: string | null;
  };
};

export const inngest = new Inngest({
  id: "relationship-platform",
});
