"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, psychometricResponses } from "@/db/schema";
import { requireSession } from "@/lib/auth/server";

const profileSchema = z.object({
  displayName: z.string().min(1).max(80),
  city: z.string().min(2).max(80),
  phone: z.string().max(40).optional(),
  bio: z.string().max(2000).optional(),
  interests: z.string().max(500).optional(),
});

export async function saveProfileBasics(formData: FormData) {
  const session = await requireSession();
  const parsed = profileSchema.parse({
    displayName: formData.get("displayName"),
    city: formData.get("city"),
    phone: (formData.get("phone") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    interests: (formData.get("interests") as string) || undefined,
  });

  const interests = parsed.interests
    ? parsed.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  await db
    .update(profiles)
    .set({
      displayName: parsed.displayName,
      city: parsed.city,
      phone: parsed.phone,
      bio: parsed.bio,
      interests,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/profile/onboarding");
  redirect("/profile/onboarding?step=questions");
}

const responseSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().max(2000),
});

export async function saveAnswer(formData: FormData) {
  const session = await requireSession();
  const parsed = responseSchema.parse({
    questionId: formData.get("questionId"),
    answer: formData.get("answer"),
  });

  await db
    .insert(psychometricResponses)
    .values({
      userId: session.user.id,
      questionId: parsed.questionId,
      answer: parsed.answer,
    })
    .onConflictDoUpdate({
      target: [psychometricResponses.userId, psychometricResponses.questionId],
      set: { answer: parsed.answer, answeredAt: new Date() },
    });

  revalidatePath("/profile/onboarding");
}

export async function markOnboardingComplete() {
  const session = await requireSession();
  await db
    .update(profiles)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id));
  revalidatePath("/profile");
  redirect("/profile?onboarded=1");
}
