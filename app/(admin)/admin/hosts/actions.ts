"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function assignHostRole(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("userId"));
  await db
    .update(schema.users)
    .set({ role: "host", updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  revalidatePath("/admin/hosts");
}

export async function removeHostRole(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("userId"));
  await db
    .update(schema.users)
    .set({ role: "user", updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  revalidatePath("/admin/hosts");
}
