"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { confirmManualPayment } from "@/lib/payments";

export async function simulatePaymentSuccess(paymentId: string) {
  const user = await requireUser();
  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);

  if (!pay || pay.userId !== user.id) {
    throw new Error("Payment not found.");
  }
  if (pay.status === "succeeded") {
    return { ok: true };
  }

  await confirmManualPayment(paymentId);
  return { ok: true };
}
