import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PaymentRecord, StartPaymentInput } from "./provider";
import { tinypesaStkPush } from "./tinypesa";

export async function startPayment(
  input: StartPaymentInput,
): Promise<PaymentRecord> {
  const [row] = await db
    .insert(schema.payments)
    .values({
      userId: input.userId,
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      provider: input.provider,
      currency: input.currency,
      amount: String(input.amount),
      status: "processing",
      senderDisplayName: input.senderDisplayName ?? "Evermore",
    })
    .returning();

  if (
    (input.provider === "tinypesa" || input.provider === "mpesa") &&
    input.phone
  ) {
    const r = await tinypesaStkPush({
      amount: input.amount,
      phone: input.phone,
      externalRef: row.id,
      displayName: input.senderDisplayName,
    });
    await db
      .update(schema.payments)
      .set({
        providerRef: r.providerRef ?? undefined,
        status: r.ok ? "processing" : "failed",
      })
      .where(eq(schema.payments.id, row.id));
  }

  // For card / cytton_mmf / manual — return pending for now; webhook updates.
  return { id: row.id, status: row.status as PaymentRecord["status"] };
}

export async function markPaymentSucceeded(
  paymentId: string,
  providerRef?: string,
) {
  const [pay] = await db
    .update(schema.payments)
    .set({
      status: "succeeded",
      providerRef,
      confirmedAt: new Date(),
    })
    .where(eq(schema.payments.id, paymentId))
    .returning();

  // Side-effects per subject kind.
  if (pay && pay.subjectKind === "ticket") {
    await db
      .update(schema.ticketPurchases)
      .set({ status: "confirmed" })
      .where(eq(schema.ticketPurchases.id, pay.subjectId));
  }
  if (pay && pay.subjectKind === "booking") {
    await db
      .update(schema.hearthBookings)
      .set({ status: "confirmed" })
      .where(eq(schema.hearthBookings.id, pay.subjectId));
  }

  return pay;
}
