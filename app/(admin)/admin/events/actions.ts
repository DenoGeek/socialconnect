"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils/format";

export async function createEvent(form: FormData) {
  await requireAdmin();
  const title = String(form.get("title"));
  const [row] = await db
    .insert(schema.events)
    .values({
      title,
      slug: slugify(`${title}-${Date.now()}`),
      subtitle: (form.get("subtitle") as string) || undefined,
      city: (form.get("city") as string) || undefined,
      venue: (form.get("venue") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      heroImageUrl: (form.get("heroImageUrl") as string) || undefined,
      capacity: Number(form.get("capacity") ?? 100),
      eliteOnly: form.get("eliteOnly") === "on",
      startsAt: new Date(String(form.get("startsAt"))),
      endsAt: new Date(String(form.get("endsAt"))),
      status: "draft",
    })
    .returning();
  redirect(`/admin/events/${row.id}/edit`);
}

export async function updateEvent(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db
    .update(schema.events)
    .set({
      title: String(form.get("title")),
      subtitle: (form.get("subtitle") as string) || undefined,
      city: (form.get("city") as string) || undefined,
      venue: (form.get("venue") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      heroImageUrl: (form.get("heroImageUrl") as string) || undefined,
      capacity: Number(form.get("capacity") ?? 100),
      eliteOnly: form.get("eliteOnly") === "on",
      startsAt: new Date(String(form.get("startsAt"))),
      endsAt: new Date(String(form.get("endsAt"))),
      status: form.get("publish") === "1" ? "published" : "draft",
      itinerary: form.get("itinerary")
        ? JSON.parse(String(form.get("itinerary")))
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(schema.events.id, id));
  redirect(`/admin/events`);
}

export async function addTicket(form: FormData) {
  await requireAdmin();
  await db.insert(schema.eventTickets).values({
    eventId: String(form.get("eventId")),
    tier: String(form.get("tier")) as never,
    label: String(form.get("label")),
    priceKsh: String(form.get("priceKsh")),
    priceUsd: String(form.get("priceUsd")),
    capacity: Number(form.get("capacity")),
    memberDiscountPct: Number(form.get("memberDiscountPct") ?? 0),
  });
}

export async function checkInTicket(form: FormData) {
  await requireAdmin();
  const code = String(form.get("code"));
  await db
    .update(schema.ticketPurchases)
    .set({ status: "checked_in", checkedInAt: new Date() })
    .where(eq(schema.ticketPurchases.code, code));
}
