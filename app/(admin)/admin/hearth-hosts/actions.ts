"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function addHearthHost(form: FormData) {
  await requireAdmin();
  await db.insert(schema.hosts).values({
    legalName: String(form.get("legalName")),
    email: String(form.get("email")),
    phone: (form.get("phone") as string) || undefined,
    userId: (form.get("userId") as string) || undefined,
    approved: form.get("approved") === "on",
  });
  revalidatePath("/admin/hearth-hosts");
}

export async function toggleHearthHost(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db
    .update(schema.hosts)
    .set({ approved: sql`NOT ${schema.hosts.approved}` })
    .where(eq(schema.hosts.id, id));
  revalidatePath("/admin/hearth-hosts");
}

export async function removeHearthHost(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db.delete(schema.hosts).where(eq(schema.hosts.id, id));
  revalidatePath("/admin/hearth-hosts");
}
