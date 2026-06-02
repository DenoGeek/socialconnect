import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { OnboardingStepper } from "./stepper";

export default async function OnboardingPage() {
  const user = await requireUser();
  const questions = await db
    .select()
    .from(schema.psychometricQuestions)
    .where(eq(schema.psychometricQuestions.active, true))
    .orderBy(asc(schema.psychometricQuestions.step));

  const responses = await db
    .select()
    .from(schema.psychometricResponses)
    .where(eq(schema.psychometricResponses.userId, user.id));

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
    <OnboardingStepper
      questions={questions}
      existingResponses={responses.map((r) => ({
        questionId: r.questionId,
        answer: r.answer,
      }))}
      startAtStep={progress?.currentStep ?? 0}
      profile={{
        displayName: profile?.displayName ?? user.name,
        phone: profile?.phone ?? "",
        city: profile?.city ?? "",
        bio: profile?.bio ?? "",
        dreamDate: profile?.dreamDate ?? "",
        intentBadges: profile?.intentBadges ?? [],
        dealBreakers: profile?.dealBreakers ?? [],
        interests: profile?.interests ?? [],
        theologicalAlignment: profile?.theologicalAlignment ?? [],
      }}
    />
  );
}
