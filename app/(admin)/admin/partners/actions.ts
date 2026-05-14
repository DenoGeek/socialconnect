"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function addPartner(form: FormData) {
  await requireAdmin();
  await db.insert(schema.datePartners).values({
    name: String(form.get("name")),
    category: (form.get("category") as string) || undefined,
    city: (form.get("city") as string) || undefined,
    contactEmail: (form.get("contactEmail") as string) || undefined,
  });
  revalidatePath("/admin/partners");
}

export async function togglePartner(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db
    .update(schema.datePartners)
    .set({ active: sql`NOT ${schema.datePartners.active}` })
    .where(eq(schema.datePartners.id, id));
  revalidatePath("/admin/partners");
}

export async function addDeal(form: FormData) {
  await requireAdmin();
  const vibeTags = String(form.get("vibeTags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await db.insert(schema.dateVaultDeals).values({
    partnerId: String(form.get("partnerId")),
    title: String(form.get("title")),
    description: (form.get("description") as string) || undefined,
    discountCode: (form.get("discountCode") as string) || undefined,
    originalPriceKsh: (form.get("originalPriceKsh") as string) || undefined,
    memberPriceKsh: (form.get("memberPriceKsh") as string) || undefined,
    thumbnail: (form.get("thumbnail") as string) || undefined,
    vibeTags,
    spendingTier: String(form.get("spendingTier") ?? "standard"),
    expiresAt: form.get("expiresAt")
      ? new Date(String(form.get("expiresAt")))
      : undefined,
  });
  revalidatePath("/admin/partners");
}

export async function toggleDeal(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db
    .update(schema.dateVaultDeals)
    .set({ active: sql`NOT ${schema.dateVaultDeals.active}` })
    .where(eq(schema.dateVaultDeals.id, id));
  revalidatePath("/admin/partners");
}
