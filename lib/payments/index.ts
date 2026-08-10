import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { planBySlug } from "@/lib/membership/plans";
import { zahariExpiryFromNow } from "@/lib/membership/zahari-plans";
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
  if (pay && pay.subjectKind === "subscription") {
    const plan = planBySlug(pay.subjectId);
    if (plan) {
      await db
        .update(schema.users)
        .set({ tier: plan.tier, updatedAt: new Date() })
        .where(eq(schema.users.id, pay.userId));
    }
  }
  if (pay && pay.subjectKind === "zahari_sovereign") {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.id, pay.subjectId))
      .limit(1);
    const planSlug = (eng?.plan ?? "6_months") as "6_months" | "1_year";
    const expiresAt = zahariExpiryFromNow(planSlug);
    await db
      .update(schema.zahariEngagements)
      .set({
        status: "active",
        sovereignPaidAt: new Date(),
        expiresAt: expiresAt ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.zahariEngagements.id, pay.subjectId));
  }
  if (pay && pay.subjectKind === "zahari_activation") {
    await db
      .update(schema.zahariEngagements)
      .set({
        status: "matched",
        activationPaidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.zahariEngagements.id, pay.subjectId));
  }

  return pay;
}

export async function startZahariPayment(opts: {
  userId: string;
  engagementId: string;
  kind: "zahari_sovereign" | "zahari_activation";
  amountUsd: number;
  provider?: "manual" | "tinypesa" | "mpesa";
  phone?: string;
}) {
  return startPayment({
    userId: opts.userId,
    subjectKind: opts.kind,
    subjectId: opts.engagementId,
    provider: opts.provider ?? "manual",
    currency: "USD",
    amount: opts.amountUsd,
    phone: opts.phone,
    senderDisplayName: "Agano Evermore · Zahari",
  });
}

export async function confirmManualPayment(paymentId: string) {
  return markPaymentSucceeded(paymentId, `manual-${Date.now()}`);
}

export function getPaymentSuccessRedirect(pay: {
  subjectKind: string;
  subjectId: string;
}): string {
  if (pay.subjectKind === "ticket") {
    return `/events/me/${pay.subjectId}`;
  }
  if (
    pay.subjectKind === "zahari_sovereign" ||
    pay.subjectKind === "zahari_activation"
  ) {
    return "/concierge";
  }
  return "/profile";
}

export async function simulateAndCompletePayment(paymentId: string) {
  const pay = await confirmManualPayment(paymentId);
  if (!pay) throw new Error("Payment not found.");
  return getPaymentSuccessRedirect(pay);
}
