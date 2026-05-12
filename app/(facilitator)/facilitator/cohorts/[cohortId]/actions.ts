"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";

export async function addCoachingNote(form: FormData) {
  const me = await requireFacilitator();
  const enrollmentId = String(form.get("enrollmentId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  await db.insert(schema.coachingNotes).values({
    enrollmentId,
    authorUserId: me.id,
    body,
  });
  revalidatePath(`/facilitator/cohorts`);
}

export async function verifyGraduation(form: FormData) {
  const me = await requireFacilitator();
  const enrollmentId = String(form.get("enrollmentId"));
  await db
    .update(schema.enrollments)
    .set({
      status: "graduated",
      graduatedAt: new Date(),
      verifiedByFacilitatorId: me.id,
    })
    .where(eq(schema.enrollments.id, enrollmentId));
  revalidatePath(`/facilitator/cohorts`);
}
