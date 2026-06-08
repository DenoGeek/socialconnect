"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  startZahariPayment,
  simulateAndCompletePayment,
} from "@/lib/payments";

async function findOrStartZahariPayment(opts: {
  userId: string;
  engagementId: string;
  kind: "zahari_sovereign" | "zahari_activation";
  amountUsd: number;
}) {
  const [pending] = await db
    .select()
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.userId, opts.userId),
        eq(schema.payments.subjectKind, opts.kind),
        eq(schema.payments.subjectId, opts.engagementId),
        ne(schema.payments.status, "succeeded"),
      ),
    )
    .limit(1);

  if (pending) return pending;

  const created = await startZahariPayment({
    userId: opts.userId,
    engagementId: opts.engagementId,
    kind: opts.kind,
    amountUsd: opts.amountUsd,
  });

  const [row] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, created.id))
    .limit(1);

  if (!row) throw new Error("Payment could not be created.");
  return row;
}

export async function simulateSovereignPayment() {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) throw new Error("No Zahari engagement");
  if (eng.sovereignPaidAt) redirect("/concierge");

  const payment = await findOrStartZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_sovereign",
    amountUsd: Number(eng.sovereignSearchFeeUsd),
  });

  const redirectTo = await simulateAndCompletePayment(payment.id);

  // #region agent log
  fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "851db9",
    },
    body: JSON.stringify({
      sessionId: "851db9",
      location: "pay/actions.ts:simulateSovereignPayment",
      message: "sovereign simulate complete",
      data: { paymentId: payment.id, redirectTo },
      timestamp: Date.now(),
      hypothesisId: "D",
    }),
  }).catch(() => {});
  // #endregion

  redirect(redirectTo);
}

export async function simulateActivationPayment() {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) throw new Error("No Zahari engagement");
  if (!eng.sovereignPaidAt) redirect("/concierge/zahari/pay");
  if (eng.activationPaidAt) redirect("/concierge");

  const payment = await findOrStartZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_activation",
    amountUsd: Number(eng.covenantActivationFeeUsd),
  });

  const redirectTo = await simulateAndCompletePayment(payment.id);
  redirect(redirectTo);
}
