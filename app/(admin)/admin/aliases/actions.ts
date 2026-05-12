"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function addAliasToPool(form: FormData) {
  await requireAdmin();
  await db.insert(schema.aliasPool).values({
    name: String(form.get("name")),
    archetype: (form.get("archetype") as string) || undefined,
  });
  revalidatePath("/admin/aliases");
}

export async function manualOverride(form: FormData) {
  await requireAdmin();
  const assignmentId = String(form.get("assignmentId"));
  const newAliasId = String(form.get("newAliasId"));
  await db
    .update(schema.aliasAssignments)
    .set({ aliasId: newAliasId, mode: "manual" })
    .where(eq(schema.aliasAssignments.id, assignmentId));
  revalidatePath("/admin/aliases");
}
