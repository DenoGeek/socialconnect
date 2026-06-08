"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { planBySlug, tierRank, type DbUserTier } from "@/lib/membership/plans";
import { startPayment, simulateAndCompletePayment } from "@/lib/payments";

export async function startMembershipUpgrade(form: FormData) {
  const user = await requireUser();
  const planSlug = String(form.get("plan") ?? "");

  const plan = planBySlug(planSlug);
  if (!plan) throw new Error("Unknown membership plan.");

  const currentRank = tierRank(user.tier as DbUserTier);
  const targetRank = tierRank(plan.tier);
  if (targetRank <= currentRank && user.tier !== "free") {
    throw new Error("You are already on this plan or higher.");
  }

  const payment = await startPayment({
    userId: user.id,
    subjectKind: "subscription",
    subjectId: plan.slug,
    provider: "manual",
    currency: "KSH",
    amount: plan.priceKsh,
    senderDisplayName: "Evermore",
  });

  const redirectTo = await simulateAndCompletePayment(payment.id);
  redirect(redirectTo);
}
