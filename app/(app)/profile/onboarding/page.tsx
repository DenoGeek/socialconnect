import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "@/db/schema/identity";
import { requireUser } from "@/lib/auth";
import { CreateProfileStepper } from "./stepper";
import { parsePersonaAliasBase } from "@/lib/profile/persona-alias";

export default async function OnboardingPage() {
  const user = await requireUser();

  let progress:
    | typeof schema.onboardingProgress.$inferSelect
    | undefined;
  let profile: Profile | undefined;

  try {
    [progress] = await db
      .select()
      .from(schema.onboardingProgress)
      .where(eq(schema.onboardingProgress.userId, user.id))
      .limit(1);

    [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);
  } catch (err) {
    // #region agent log
    const message = err instanceof Error ? err.message : String(err);
    console.error("[onboarding] db load failed:", message);
    fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "851db9",
      },
      body: JSON.stringify({
        sessionId: "851db9",
        location: "onboarding/page.tsx:dbLoad",
        message: "onboarding page db load failed",
        data: { error: message },
        timestamp: Date.now(),
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    throw err;
  }

  const spiritualRhythmHome = profile?.spiritualRhythmsHome?.[0] ?? "";

  return (
    <CreateProfileStepper
      startAtStep={progress?.currentStep ?? 0}
      email={user.email}
      profile={{
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        gender: profile?.gender ?? "",
        birthYear: profile?.birthYear ? String(profile.birthYear) : "",
        country: profile?.country ?? "",
        city: profile?.city ?? "",
        countryOfHeritage: profile?.countryOfHeritage ?? "",
        familialStatus: profile?.familialStatus ?? "",
        divorceCertified: profile?.divorceCertified ?? false,
        childrenCount:
          profile?.childrenCount != null ? String(profile.childrenCount) : "",
        childrenCustody: profile?.childrenCustody ?? "",
        educationLevel: profile?.educationLevel ?? "",
        profession: profile?.profession ?? "",
        primaryIndustry: profile?.primaryIndustry ?? "",
        personaCategory: profile?.personaCategory ?? "",
        personaAlias: profile?.personaAlias
          ? parsePersonaAliasBase(profile.personaAlias)
          : "",
        personaAliasCode: profile?.personaAliasCode
          ? String(profile.personaAliasCode)
          : "",
        phone: profile?.phone ?? "",
        altarTimeline: profile?.altarTimeline ?? "",
        covenantFoundationsSafeguard: profile?.covenantFoundationsSafeguard ?? false,
        relocationOpenness: profile?.relocationOpenness ?? "",
        spiritualRhythmHome,
        doctrinalAlignment: profile?.doctrinalAlignment ?? "",
        householdLeadership: profile?.householdLeadership ?? "",
        professionalRhythm: profile?.professionalRhythm ?? "",
        financialStewardship: profile?.financialStewardship ?? [],
        environmentPreference: profile?.environmentPreference ?? "",
        interests: profile?.interests ?? [],
        coreFaithIdentity: profile?.coreFaithIdentity ?? "",
      }}
    />
  );
}
