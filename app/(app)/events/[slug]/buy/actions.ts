"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { signTicketToken } from "@/lib/utils/qr";
import { startPayment, simulateAndCompletePayment } from "@/lib/payments";

export async function purchaseTicket(form: FormData) {
  const user = await requireUser();
  const ticketId = String(form.get("ticketId"));
  const eventId = String(form.get("eventId"));
  const currency = String(form.get("currency")) as "KSH" | "USD";
  const provider = String(form.get("provider")) as
    | "tinypesa"
    | "mpesa"
    | "card";
  const phone = String(form.get("phone") ?? "");

  const [ticket] = await db
    .select()
    .from(schema.eventTickets)
    .where(eq(schema.eventTickets.id, ticketId))
    .limit(1);
  if (!ticket) throw new Error("Ticket not found");
  if (ticket.sold >= ticket.capacity) {
    throw new Error("Sold out");
  }

  const amount =
    currency === "KSH" ? Number(ticket.priceKsh) : Number(ticket.priceUsd);

  const code = `EVR-${randomBytes(4).toString("hex").toUpperCase()}`;
  const tempId = randomBytes(8).toString("hex");
  const qrToken = signTicketToken({ ticketCode: code, userId: user.id, eventId, jti: tempId });

  const [purchase] = await db
    .insert(schema.ticketPurchases)
    .values({
      eventId,
      ticketId,
      userId: user.id,
      code,
      qrToken,
      status: "pending_payment",
      currency,
      amount: amount.toString(),
    })
    .returning();

  // Increment soft sold counter pessimistically; webhook confirms.
  await db
    .update(schema.eventTickets)
    .set({ sold: sql`${schema.eventTickets.sold} + 1` })
    .where(eq(schema.eventTickets.id, ticketId));

  const payment = await startPayment({
    userId: user.id,
    subjectKind: "ticket",
    subjectId: purchase.id,
    provider: "manual",
    currency,
    amount,
    phone,
    senderDisplayName: "Evermore Events",
  });

  const redirectTo = await simulateAndCompletePayment(payment.id);
  redirect(redirectTo);
}
