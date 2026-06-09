import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { CreateProfileStepper } from "./stepper";

export default async function OnboardingPage() {
  const user = await requireUser();

  const [progress] = await db
    .select()
    .from(schema.onboardingProgress)
    .where(eq(schema.onboardingProgress.userId, user.id))
    .limit(1);

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  return (
    <CreateProfileStepper
      startAtStep={progress?.currentStep ?? 0}
      email={user.email}
      profile={{
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        gender: profile?.gender ?? "",
        birthYear: profile?.birthYear ? String(profile.birthYear) : "",
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
        personaAlias: profile?.personaAlias ?? "",
        phone: profile?.phone ?? "",
        altarTimeline: profile?.altarTimeline ?? "",
        relocationOpenness: profile?.relocationOpenness ?? "",
        familyPlanningVision: profile?.familyPlanningVision ?? "",
        spiritualRhythmsHome: profile?.spiritualRhythmsHome ?? [],
        doctrinalAlignment: profile?.doctrinalAlignment ?? "",
        professionalRhythm: profile?.professionalRhythm ?? "",
        financialStewardship: profile?.financialStewardship ?? [],
        environmentPreference: profile?.environmentPreference ?? "",
        hospitalityFlow: profile?.hospitalityFlow ?? "",
        familyStatusCompatibility: profile?.familyStatusCompatibility ?? "",
        householdBlueprint: profile?.householdBlueprint ?? "",
        interests: profile?.interests ?? [],
        coreFaithIdentity: profile?.coreFaithIdentity ?? "",
        householdLeadership: profile?.householdLeadership ?? "",
        doctrinalFlexibility: profile?.doctrinalFlexibility ?? "",
      }}
    />
  );
}
