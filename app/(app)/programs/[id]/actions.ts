"use server";

import { redirect } from "next/navigation";
import { eq, and, asc, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function enrollInProgram(form: FormData) {
  const user = await requireUser();
  const programId = String(form.get("programId"));

  // Find the next open cohort.
  const cohorts = await db
    .select()
    .from(schema.cohorts)
    .where(eq(schema.cohorts.programId, programId))
    .orderBy(asc(schema.cohorts.startsOn));

  let cohort = cohorts[0];
  if (!cohort) {
    // No cohorts — create a default one.
    const [c] = await db
      .insert(schema.cohorts)
      .values({
        programId,
        name: "Open enrollment",
        startsOn: new Date(),
      })
      .returning();
    cohort = c;
  }

  // Determine partner if user is in an active duo sync.
  const [duo] = await db
    .select()
    .from(schema.duoSyncs)
    .where(
      and(
        or(
          eq(schema.duoSyncs.initiatorUserId, user.id),
          eq(schema.duoSyncs.inviteeUserId, user.id),
        ),
        eq(schema.duoSyncs.status, "active"),
      ),
    )
    .limit(1);
  const partnerUserId =
    duo?.initiatorUserId === user.id
      ? duo.inviteeUserId ?? null
      : duo?.initiatorUserId ?? null;

  const [e] = await db
    .insert(schema.enrollments)
    .values({
      cohortId: cohort.id,
      primaryUserId: user.id,
      partnerUserId: partnerUserId ?? undefined,
    })
    .returning();
  redirect(`/programs/me/${e.id}`);
}

export async function markLessonComplete(form: FormData) {
  const user = await requireUser();
  const enrollmentId = String(form.get("enrollmentId"));
  const lessonId = String(form.get("lessonId"));
  const reflection = String(form.get("reflection") ?? "") || null;

  await db
    .insert(schema.lessonCompletions)
    .values({
      enrollmentId,
      lessonId,
      completedByUserId: user.id,
      reflection: reflection ?? undefined,
    })
    .onConflictDoNothing();
}
