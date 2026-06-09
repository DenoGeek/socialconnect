"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { heterosexualPreference } from "@/lib/profile/gender";

export type SaveStepResult = { ok: true; finalized?: boolean };

export async function saveStep(form: FormData): Promise<SaveStepResult> {
  const user = await requireUser();
  const step = Number(form.get("step") ?? 0);
  const totalSteps = Number(form.get("totalSteps") ?? 0);
  const finalize = form.get("finalize") === "1";

  const profileUpdates: Record<string, unknown> = {};

  // Plain text / single-select fields.
  for (const f of [
    "firstName",
    "lastName",
    "city",
    "countryOfHeritage",
    "familialStatus",
    "childrenCustody",
    "educationLevel",
    "profession",
    "primaryIndustry",
    "personaCategory",
    "personaAlias",
    "phone",
    "gender",
    "altarTimeline",
    "relocationOpenness",
    "familyPlanningVision",
    "doctrinalAlignment",
    "professionalRhythm",
    "environmentPreference",
    "hospitalityFlow",
    "familyStatusCompatibility",
    "householdBlueprint",
    "coreFaithIdentity",
    "householdLeadership",
    "doctrinalFlexibility",
  ] as const) {
    const v = form.get(f);
    if (typeof v === "string" && v.length > 0) profileUpdates[f] = v;
  }

  // Multi-select JSON arrays.
  for (const f of [
    "interests",
    "spiritualRhythmsHome",
    "financialStewardship",
  ] as const) {
    const raw = form.get(f);
    if (typeof raw === "string" && raw.length > 0) {
      profileUpdates[f] = JSON.parse(raw);
    }
  }

  // Numeric + boolean fields.
  const birthYearRaw = form.get("birthYear");
  if (typeof birthYearRaw === "string" && birthYearRaw.length > 0) {
    profileUpdates.birthYear = Number(birthYearRaw);
  }
  const childrenCountRaw = form.get("childrenCount");
  if (typeof childrenCountRaw === "string" && childrenCountRaw.length > 0) {
    profileUpdates.childrenCount = Number(childrenCountRaw);
  }
  profileUpdates.divorceCertified = form.get("divorceCertified") === "1";

  // The chosen Community Alias persona becomes the private display name.
  if (typeof profileUpdates.personaAlias === "string") {
    profileUpdates.displayName = profileUpdates.personaAlias;
  }

  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  const genderValue = form.get("gender");
  if (typeof genderValue === "string" && (genderValue === "man" || genderValue === "woman")) {
    profileUpdates.lookingFor = {
      ...((existing[0]?.lookingFor as Record<string, unknown> | undefined) ?? {}),
      genderPreference: heterosexualPreference(genderValue),
    };
  }

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
    revalidatePath("/profile/onboarding");
    return { ok: true, finalized: true };
  }

  return { ok: true };
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
  redirect("/profile");
}
