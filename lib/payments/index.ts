import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { planBySlug } from "@/lib/membership/plans";
import type { PaymentRecord, StartPaymentInput } from "./provider";
import { tinypesaStkPush } from "./tinypesa";

export async function startPayment(
  input: StartPaymentInput,
): Promise<PaymentRecord> {
  let row;
  try {
    [row] = await db
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
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "851db9",
      },
      body: JSON.stringify({
        sessionId: "851db9",
        location: "payments/index.ts:startPayment",
        message: "payment insert failed",
        data: {
          provider: input.provider,
          subjectKind: input.subjectKind,
          error: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
        hypothesisId: "F",
      }),
    }).catch(() => {});
    // #endregion
    throw err;
  }

  // #region agent log
  fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "851db9",
    },
    body: JSON.stringify({
      sessionId: "851db9",
      location: "payments/index.ts:startPayment",
      message: "payment insert ok",
      data: {
        paymentId: row.id,
        provider: input.provider,
        subjectKind: input.subjectKind,
      },
      timestamp: Date.now(),
      hypothesisId: "F",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion

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
    await db
      .update(schema.zahariEngagements)
      .set({
        status: "active",
        sovereignPaidAt: new Date(),
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
}) {
  return startPayment({
    userId: opts.userId,
    subjectKind: opts.kind,
    subjectId: opts.engagementId,
    provider: "manual",
    currency: "USD",
    amount: opts.amountUsd,
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
