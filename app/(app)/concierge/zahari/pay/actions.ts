"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { startZahariPayment } from "@/lib/payments";

export async function requestSovereignPayment() {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) throw new Error("No Zahari engagement");

  const payment = await startZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_sovereign",
    amountUsd: Number(eng.sovereignSearchFeeUsd),
  });

  redirect(`/payments/${payment.id}`);
}

export async function requestActivationPayment() {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) throw new Error("No Zahari engagement");

  const payment = await startZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_activation",
    amountUsd: Number(eng.covenantActivationFeeUsd),
  });

  redirect(`/payments/${payment.id}`);
}
