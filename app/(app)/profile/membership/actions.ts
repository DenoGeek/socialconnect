"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { planBySlug, tierRank, type DbUserTier } from "@/lib/membership/plans";
import { startPayment } from "@/lib/payments";

export async function startMembershipUpgrade(form: FormData) {
  const user = await requireUser();
  const planSlug = String(form.get("plan") ?? "");
  const phone = String(form.get("phone") ?? "").trim();

  const plan = planBySlug(planSlug);
  if (!plan) throw new Error("Unknown membership plan.");

  const currentRank = tierRank(user.tier as DbUserTier);
  const targetRank = tierRank(plan.tier);
  if (targetRank <= currentRank && user.tier !== "free") {
    throw new Error("You are already on this plan or higher.");
  }

  if (!phone) {
    throw new Error("M-Pesa phone number is required (e.g. 2547XXXXXXXX).");
  }

  const payment = await startPayment({
    userId: user.id,
    subjectKind: "subscription",
    subjectId: plan.slug,
    provider: "tinypesa",
    currency: "KES",
    amount: plan.priceKsh,
    phone,
    senderDisplayName: "Evermore",
  });

  const [row] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, payment.id))
    .limit(1);

  return {
    paymentId: payment.id,
    status: payment.status,
    plan: plan.label,
    amountKsh: plan.priceKsh,
    providerRef: row?.providerRef ?? null,
  };
}
