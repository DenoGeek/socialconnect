"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { confirmManualPayment } from "@/lib/payments";
import {
  ZAHARI_PLANS,
  type ZahariPlanSlug,
} from "@/lib/membership/zahari-plans";

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

export async function bookZahariInterview(form: FormData) {
  await requireAdmin();
  const engagementId = String(form.get("engagementId"));
  const scheduledAtRaw = String(form.get("interviewScheduledAt") ?? "");
  const meetingUrl = String(form.get("interviewMeetingUrl") ?? "").trim();
  const notes = String(form.get("interviewNotes") ?? "").trim();

  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Interview date/time is required");
  }

  await db
    .update(schema.zahariEngagements)
    .set({
      status: "interview_scheduled",
      interviewScheduledAt: scheduledAt,
      interviewMeetingUrl: meetingUrl || null,
      interviewNotes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, engagementId));

  revalidatePath("/admin/zahari");
}

export async function markInterviewPassed(form: FormData) {
  await requireAdmin();
  const engagementId = String(form.get("engagementId"));
  const plan = String(form.get("recommendedPlan") ?? "6_months") as ZahariPlanSlug;
  const fee =
    ZAHARI_PLANS.find((p) => p.slug === plan)?.priceUsd ?? 1500;

  await db
    .update(schema.zahariEngagements)
    .set({
      status: "pending_payment",
      plan,
      sovereignSearchFeeUsd: String(fee),
      interviewCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, engagementId));

  revalidatePath("/admin/zahari");
}

export async function markInterviewRejected(form: FormData) {
  await requireAdmin();
  const engagementId = String(form.get("engagementId"));
  const notes = String(form.get("interviewNotes") ?? "").trim();

  await db
    .update(schema.zahariEngagements)
    .set({
      status: "interview_rejected",
      interviewCompletedAt: new Date(),
      interviewNotes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, engagementId));

  revalidatePath("/admin/zahari");
}

export async function adminCancelZahari(form: FormData) {
  await requireAdmin();
  const engagementId = String(form.get("engagementId"));
  const reason = String(form.get("cancelReason") ?? "Ended by staff");

  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.id, engagementId))
    .limit(1);
  if (!eng) throw new Error("Engagement not found");

  await db
    .update(schema.zahariEngagements)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason,
      autoRenew: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, engagementId));

  // Cancel any non-succeeded pending Zahari payments.
  await db
    .update(schema.payments)
    .set({ status: "failed" })
    .where(
      and(
        eq(schema.payments.subjectId, engagementId),
        ne(schema.payments.status, "succeeded"),
      ),
    );

  revalidatePath("/admin/zahari");
}
