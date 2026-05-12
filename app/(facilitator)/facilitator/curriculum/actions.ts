"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";

export async function uploadLesson(form: FormData) {
  await requireFacilitator();
  await db
    .insert(schema.programLessons)
    .values({
      programId: String(form.get("programId")),
      week: Number(form.get("week")),
      title: String(form.get("title")),
      body: (form.get("body") as string) || undefined,
      videoUrl: (form.get("videoUrl") as string) || undefined,
      connectionBoxUrl: (form.get("connectionBoxUrl") as string) || undefined,
    })
    .onConflictDoNothing();
  revalidatePath("/facilitator/curriculum");
}
