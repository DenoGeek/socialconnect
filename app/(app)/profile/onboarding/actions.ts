"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { heterosexualPreference } from "@/lib/profile/gender";
import { resolvePersonaAliasForSave } from "@/lib/profile/persona-alias";

export type SaveStepResult = {
  ok: true;
  finalized?: boolean;
  personaAliasCode?: number;
};

export async function saveStep(form: FormData): Promise<SaveStepResult> {
  const user = await requireUser();
  const step = Number(form.get("step") ?? 0);
  const totalSteps = Number(form.get("totalSteps") ?? 0);
  const finalize = form.get("finalize") === "1";

  const profileUpdates: Record<string, unknown> = {};
  let assignedPersonaAliasCode: number | undefined;

  // Plain text / single-select fields.
  for (const f of [
    "firstName",
    "lastName",
    "country",
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
    "doctrinalAlignment",
    "householdLeadership",
    "professionalRhythm",
    "environmentPreference",
    "coreFaithIdentity",
  ] as const) {
    const v = form.get(f);
    if (typeof v === "string" && v.length > 0) profileUpdates[f] = v;
  }

  // Spiritual rhythm home — stored as single-element jsonb array for compatibility.
  const spiritualRhythmHome = form.get("spiritualRhythmHome");
  if (typeof spiritualRhythmHome === "string" && spiritualRhythmHome.length > 0) {
    profileUpdates.spiritualRhythmsHome = [spiritualRhythmHome];
  }

  // Multi-select JSON arrays.
  for (const f of ["interests", "financialStewardship"] as const) {
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
  profileUpdates.covenantFoundationsSafeguard =
    form.get("covenantFoundationsSafeguard") === "1";

  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  // Community Alias: base name + auto-generated unique code (e.g. The Steward#514).
  if (typeof profileUpdates.personaAlias === "string") {
    const resolved = await resolvePersonaAliasForSave(
      profileUpdates.personaAlias,
      existing[0]?.personaAliasCode,
    );
    profileUpdates.personaAlias = resolved.base;
    profileUpdates.personaAliasCode = resolved.code;
    profileUpdates.displayName = resolved.display;
    assignedPersonaAliasCode = resolved.code;
  }

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

  // Keep the account name in sync with the profile's legal name.
  const first = profileUpdates.firstName as string | undefined;
  const last = profileUpdates.lastName as string | undefined;
  if (first || last) {
    const fullName = [first, last].filter(Boolean).join(" ").trim();
    if (fullName) {
      await db
        .update(schema.users)
        .set({ name: fullName, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    }
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
    return { ok: true, finalized: true, personaAliasCode: assignedPersonaAliasCode };
  }

  return { ok: true, personaAliasCode: assignedPersonaAliasCode };
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
