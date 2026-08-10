"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import {
  startZahariPayment,
  simulateAndCompletePayment,
} from "@/lib/payments";
import {
  ZAHARI_PLANS,
  type ZahariPlanSlug,
} from "@/lib/membership/zahari-plans";
import { canZahariPay } from "@/lib/membership/zahari-status";

async function requirePayableEngagement(userId: string) {
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, userId))
    .limit(1);
  if (!eng) throw new Error("No Zahari engagement");
  if (!canZahariPay(eng)) {
    if (eng.sovereignPaidAt) redirect("/concierge");
    redirect("/apply/status");
  }
  return eng;
}

async function findOrStartZahariPayment(opts: {
  userId: string;
  engagementId: string;
  kind: "zahari_sovereign" | "zahari_activation";
  amountUsd: number;
  provider?: "manual" | "tinypesa";
  phone?: string;
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

  if (pending && opts.provider !== "tinypesa") return pending;

  const created = await startZahariPayment({
    userId: opts.userId,
    engagementId: opts.engagementId,
    kind: opts.kind,
    amountUsd: opts.amountUsd,
    provider: opts.provider ?? "manual",
    phone: opts.phone,
  });

  const [row] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, created.id))
    .limit(1);

  if (!row) throw new Error("Payment could not be created.");
  return row;
}

export async function selectZahariPlan(form: FormData) {
  const user = await requireUser();
  const eng = await requirePayableEngagement(user.id);
  const plan = String(form.get("plan") ?? "") as ZahariPlanSlug;
  const selected = ZAHARI_PLANS.find((p) => p.slug === plan);
  if (!selected) throw new Error("Choose a plan");

  await db
    .update(schema.zahariEngagements)
    .set({
      plan: selected.slug,
      sovereignSearchFeeUsd: String(selected.priceUsd),
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, eng.id));

  redirect("/concierge/zahari/pay");
}

export async function startPaybillPayment() {
  const user = await requireUser();
  const eng = await requirePayableEngagement(user.id);
  if (!eng.plan) redirect("/concierge/zahari/pay");

  const payment = await findOrStartZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_sovereign",
    amountUsd: Number(eng.sovereignSearchFeeUsd),
    provider: "manual",
  });

  redirect(`/payments/${payment.id}?method=paybill`);
}

export async function startTinypesaPayment(form: FormData) {
  const user = await requireUser();
  const eng = await requirePayableEngagement(user.id);
  if (!eng.plan) redirect("/concierge/zahari/pay");
  const phone = String(form.get("phone") ?? "").trim();
  if (!phone) throw new Error("M-Pesa phone number is required");

  const payment = await findOrStartZahariPayment({
    userId: user.id,
    engagementId: eng.id,
    kind: "zahari_sovereign",
    amountUsd: Number(eng.sovereignSearchFeeUsd),
    provider: "tinypesa",
    phone,
  });

  redirect(`/payments/${payment.id}?method=tinypesa`);
}

export async function simulateSovereignPayment() {
  const user = await requireUser();
  const eng = await requirePayableEngagement(user.id);
  if (!eng.plan) redirect("/concierge/zahari/pay");

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
