"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { confirmManualPayment } from "@/lib/payments";

export async function confirmZahariPayment(form: FormData) {
  await requireAdmin();
  const paymentId = String(form.get("paymentId"));
  await confirmManualPayment(paymentId);
  revalidatePath("/admin/zahari");
}

export async function presentCandidate(form: FormData) {
  await requireAdmin();
  const engagementId = String(form.get("engagementId"));
  const candidateUserId = String(form.get("candidateUserId"));
  const summary = String(form.get("presentationSummary") ?? "");

  await db.insert(schema.zahariIntroductions).values({
    engagementId,
    candidateUserId,
    presentationSummary: summary || undefined,
    status: "presented",
  });

  revalidatePath("/admin/zahari");
}
