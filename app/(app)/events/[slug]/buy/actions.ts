"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketPurchases, ticketTiers } from "@/db/schema";
import { requireSession } from "@/lib/auth/server";
import { paymentProviderFor } from "@/lib/payments";
import { signTicketToken } from "@/lib/utils/qr";
import { normalizeMsisdn } from "@/lib/utils/phone";
import { inngest } from "@/inngest/client";

export interface InitiatePurchaseResult {
  ok: boolean;
  paymentId?: string;
  ticketPurchaseId?: string;
  error?: string;
}

/**
 * Reserves a ticket and initiates an M-Pesa STK Push.
 *
 * Capacity is enforced via a conditional UPDATE:
 *   `UPDATE ticket_tiers SET sold_qty = sold_qty + 1
 *      WHERE id = $1 AND sold_qty < max_qty`
 * If `rowCount === 0`, the tier is full — abort before charging the user.
 *
 * If TinyPesa initiate succeeds, return paymentId so the client can poll.
 * If it fails, the ticket is rolled back to release the held seat.
 */
export async function initiatePurchase(input: {
  tierId: string;
  msisdn: string;
}): Promise<InitiatePurchaseResult> {
  const session = await requireSession();
  const userId = session.user.id;

  const msisdn = normalizeMsisdn(input.msisdn);
  if (!msisdn) {
    return { ok: false, error: "Please enter a valid Kenyan phone number." };
  }

  const [tier] = await db.select().from(ticketTiers).where(eq(ticketTiers.id, input.tierId)).limit(1);
  if (!tier) return { ok: false, error: "Ticket tier not found." };

  const [event] = await db.select().from(events).where(eq(events.id, tier.eventId)).limit(1);
  if (!event) return { ok: false, error: "Event not found." };
  if (event.status !== "published") {
    return { ok: false, error: "This event isn't accepting bookings right now." };
  }

  // Already paid? Don't double-charge.
  const existingPaid = await db
    .select()
    .from(ticketPurchases)
    .where(
      and(
        eq(ticketPurchases.userId, userId),
        eq(ticketPurchases.eventId, event.id),
      ),
    )
    .limit(1);
  if (existingPaid[0] && (existingPaid[0].status === "paid" || existingPaid[0].status === "checked_in")) {
    return { ok: false, error: "You already have a ticket for this event." };
  }

  // Reserve a seat atomically.
  const reserved = await db
    .update(ticketTiers)
    .set({ soldQty: sql`${ticketTiers.soldQty} + 1` })
    .where(and(eq(ticketTiers.id, tier.id), sql`${ticketTiers.soldQty} < ${ticketTiers.maxQty}`))
    .returning({ id: ticketTiers.id });
  if (reserved.length === 0) {
    return { ok: false, error: "This tier just sold out." };
  }

  let purchaseId: string | undefined;
  try {
    // Insert pending ticket row — qrToken is generated against the row id.
    // We bootstrap with a placeholder, then update with the signed JWT.
    const [purchase] = await db
      .insert(ticketPurchases)
      .values({
        userId,
        eventId: event.id,
        tierId: tier.id,
        status: "pending",
        qrToken: "pending",
      })
      .returning();
    purchaseId = purchase.id;

    const qrToken = signTicketToken({
      ticketId: purchase.id,
      userId,
      eventId: event.id,
    });
    await db
      .update(ticketPurchases)
      .set({ qrToken, updatedAt: new Date() })
      .where(eq(ticketPurchases.id, purchase.id));

    const provider = paymentProviderFor("KES");
    const result = await provider.initiate({
      idempotencyKey: `ticket:${purchase.id}`,
      userId,
      amountMinor: tier.priceKes,
      currency: "KES",
      purpose: "ticket",
      purposeRef: purchase.id,
      msisdn,
      description: `${event.title} · ${tier.name}`,
    });

    await db
      .update(ticketPurchases)
      .set({ paymentId: result.paymentId, updatedAt: new Date() })
      .where(eq(ticketPurchases.id, purchase.id));

    // Fire-and-forget: the alias assignment runs once payment settles via the
    // webhook. We send the trigger now optimistically; the function is
    // idempotent if the user later refunds.
    await inngest.send({
      name: "ticket.purchased",
      data: {
        userId,
        eventId: event.id,
        ticketPurchaseId: purchase.id,
      },
    });

    return { ok: true, paymentId: result.paymentId, ticketPurchaseId: purchase.id };
  } catch (err) {
    // Roll back the seat reservation and ticket row.
    await db
      .update(ticketTiers)
      .set({ soldQty: sql`${ticketTiers.soldQty} - 1` })
      .where(eq(ticketTiers.id, tier.id));
    if (purchaseId) {
      await db
        .update(ticketPurchases)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(ticketPurchases.id, purchaseId));
    }
    const message = err instanceof Error ? err.message : "Payment could not be started.";
    return { ok: false, error: message };
  }
}

