import { inngest, type AppEvents } from "../client";
import { assignAlias } from "@/lib/alias/assign";

/**
 * When a ticket is purchased, give the buyer their per-event alias.
 * Idempotent — if the user already has one, the helper returns it.
 */
export const assignAliasOnPurchase = inngest.createFunction(
  {
    id: "assign-alias-on-purchase",
    name: "Assign per-event alias on ticket purchase",
    triggers: [{ event: "ticket.purchased" }],
  },
  async ({ event, step }) => {
    const data = event.data as AppEvents["ticket.purchased"];
    const assignment = await step.run("assign-alias", async () =>
      assignAlias(data.eventId, data.userId),
    );
    return { assignmentId: assignment.id, aliasId: assignment.aliasId };
  },
);
