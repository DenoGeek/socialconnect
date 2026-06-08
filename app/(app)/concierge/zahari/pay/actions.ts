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
