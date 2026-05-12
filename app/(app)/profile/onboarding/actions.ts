"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { detectContradictions } from "@/lib/intent/badges";

export async function saveStep(form: FormData) {
  const user = await requireUser();
  const step = Number(form.get("step") ?? 0);
  const totalSteps = Number(form.get("totalSteps") ?? 0);
  const finalize = form.get("finalize") === "1";

  // Persist answers for this step.
  const answers = JSON.parse(String(form.get("answers") ?? "[]")) as Array<{
    questionId: string;
    answer: unknown;
  }>;
  for (const a of answers) {
    await db
      .insert(schema.psychometricResponses)
      .values({
        userId: user.id,
        questionId: a.questionId,
        answer: a.answer as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: [
          schema.psychometricResponses.userId,
          schema.psychometricResponses.questionId,
        ],
        set: { answer: a.answer as Record<string, unknown>, answeredAt: new Date() },
      });
  }

  // Persist profile bits if present.
  const profileUpdates: Record<string, unknown> = {};
  for (const f of [
    "displayName",
    "city",
    "bio",
    "dreamDate",
    "spendingTier",
  ] as const) {
    const v = form.get(f);
    if (typeof v === "string" && v.length > 0) profileUpdates[f] = v;
  }
  for (const f of [
    "intentBadges",
    "dealBreakers",
    "interests",
    "theologicalAlignment",
  ] as const) {
    const raw = form.get(f);
    if (typeof raw === "string" && raw.length > 0) {
      profileUpdates[f] = JSON.parse(raw);
    }
  }

  // Detect contradictions on intent badges and flag for admin.
  if (
    Array.isArray(profileUpdates.intentBadges) &&
    detectContradictions(profileUpdates.intentBadges as string[]).length > 0
  ) {
    profileUpdates.flaggedForReview = true;
  }

  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.profiles)
      .set({
        ...profileUpdates,
        onboardingProgress: step,
        ...(finalize ? { onboardingCompletedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, user.id));
  } else {
    await db.insert(schema.profiles).values({
      userId: user.id,
      ...profileUpdates,
      onboardingProgress: step,
      ...(finalize ? { onboardingCompletedAt: new Date() } : {}),
    });
  }

  // Resume tracking.
  await db
    .insert(schema.onboardingProgress)
    .values({
      userId: user.id,
      currentStep: step,
      totalSteps,
      lastTouchedAt: new Date(),
      ...(finalize ? { completedAt: new Date() } : {}),
    })
    .onConflictDoUpdate({
      target: schema.onboardingProgress.userId,
      set: {
        currentStep: step,
        totalSteps,
        lastTouchedAt: new Date(),
        ...(finalize ? { completedAt: new Date() } : {}),
      },
    });

  if (finalize) {
    revalidatePath("/profile");
    redirect("/profile?onboarded=1");
  }
}

export async function switchMode(form: FormData) {
  const user = await requireUser();
  const mode = String(form.get("mode") ?? "explorer") as
    | "explorer"
    | "couple"
    | "elite";

  await db
    .update(schema.users)
    .set({ mode, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  // Log the switch so private match history is preserved on tier change.
  await db.insert(schema.auditLog).values({
    actorUserId: user.id,
    action: "user.mode.switch",
    target: user.id,
    diff: sql`${JSON.stringify({ to: mode })}::jsonb`,
  });

  revalidatePath("/profile");
}
