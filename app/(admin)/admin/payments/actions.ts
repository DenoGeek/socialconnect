"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { confirmManualPayment } from "@/lib/payments";

export async function confirmPaymentManually(form: FormData) {
  const admin = await requireAdmin();
  const paymentId = String(form.get("paymentId") ?? "");
  if (!paymentId) throw new Error("Payment id is required.");

  const [before] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);
  if (!before) throw new Error("Payment not found.");
  if (before.status === "succeeded") {
    revalidatePath("/admin/payments");
    return;
  }

  await confirmManualPayment(paymentId);

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "admin.payment.manual_confirm",
    target: paymentId,
    diff: sql`${JSON.stringify({
      subjectKind: before.subjectKind,
      amount: before.amount,
      currency: before.currency,
      previousStatus: before.status,
    })}::jsonb`,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/zahari");
  revalidatePath("/admin/activity");
}
