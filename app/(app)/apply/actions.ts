"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

const MIN_AGE = 27;
const MAX_AGE = 60;

function validateAge(age: number) {
  if (age < MIN_AGE || age > MAX_AGE) {
    throw new Error(`Members must be between ${MIN_AGE} and ${MAX_AGE} years old.`);
  }
}

export async function submitAmariApplication(form: FormData) {
  const user = await requireUser();
  const age = Number(form.get("ageAttested"));
  validateAge(age);
  const city = String(form.get("city") ?? "").trim();
  const intentSummary = String(form.get("intentSummary") ?? "").trim();
  const optIntoCandidatePool = form.get("optIntoCandidatePool") === "on";

  if (!city || !intentSummary) {
    throw new Error("City and intent summary are required.");
  }

  await db.insert(schema.memberApplications).values({
    userId: user.id,
    pathway: "amari",
    status: "submitted",
    ageAttested: age,
    city,
    intentSummary,
    optIntoCandidatePool,
    submittedAt: new Date(),
  });

  await db
    .update(schema.users)
    .set({ vettingStatus: "pending", updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/apply/status");
  redirect("/apply/status");
}

export async function submitZahariApplication(form: FormData) {
  const user = await requireUser();
  const age = Number(form.get("ageAttested"));
  validateAge(age);
  const city = String(form.get("city") ?? "").trim();
  const professionalContext = String(form.get("professionalContext") ?? "").trim();
  const discretionRequirements = String(
    form.get("discretionRequirements") ?? "",
  ).trim();
  const legacyGoals = String(form.get("legacyGoals") ?? "").trim();

  if (!city || !professionalContext || !legacyGoals) {
    throw new Error("Please complete all required fields.");
  }

  await db.insert(schema.memberApplications).values({
    userId: user.id,
    pathway: "zahari",
    status: "submitted",
    ageAttested: age,
    city,
    professionalContext,
    discretionRequirements: discretionRequirements || undefined,
    legacyGoals,
    submittedAt: new Date(),
  });

  await db
    .update(schema.users)
    .set({ vettingStatus: "pending", updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/apply/status");
  redirect("/apply/status");
}
