import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { inngest } from "../client";
import { assignAlias } from "@/lib/alias/assign";
import { notifyTicketConfirmed } from "@/lib/notifications";

export const assignAliasOnPurchase = inngest.createFunction(
  {
    id: "assign-alias-on-purchase",
    triggers: [{ event: "ticket.purchased" }],
  },
  async ({ event }) => {
    const data = (event as unknown as { data: { ticketPurchaseId: string; userId: string; eventId: string } }).data;
    const { ticketPurchaseId, userId, eventId } = data;
    await assignAlias({ userId, eventId });
    const [tp] = await db
      .select()
      .from(schema.ticketPurchases)
      .where(eq(schema.ticketPurchases.id, ticketPurchaseId))
      .limit(1);
    if (tp) {
      await notifyTicketConfirmed({ userId, ticketCode: tp.code });
    }
  },
);
