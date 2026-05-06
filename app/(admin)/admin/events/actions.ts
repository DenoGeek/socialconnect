"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events, ticketTiers } from "@/db/schema";
import { requireRole } from "@/lib/auth/server";
import { slugify } from "@/lib/utils/format";

const eventSchema = z.object({
  title: z.string().min(3),
  city: z.string().min(2),
  venueName: z.string().optional(),
  description: z.string().optional(),
  tier: z.enum(["one_day", "two_day", "retreat"]),
  status: z.enum(["draft", "published", "sold_out", "completed", "cancelled"]),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.coerce.number().int().min(1),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  tierName: z.string().min(1),
  tierPrice: z.coerce.number().int().min(0),
  tierMaxQty: z.coerce.number().int().min(1),
});

export async function createEvent(formData: FormData) {
  await requireRole(["admin"]);

  const parsed = eventSchema.parse({
    title: formData.get("title"),
    city: formData.get("city"),
    venueName: formData.get("venueName") || undefined,
    description: formData.get("description") || undefined,
    tier: formData.get("tier"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity"),
    coverImageUrl: formData.get("coverImageUrl") || undefined,
    tierName: formData.get("tierName"),
    tierPrice: formData.get("tierPrice"),
    tierMaxQty: formData.get("tierMaxQty"),
  });

  const slug = slugify(`${parsed.title}-${new Date(parsed.startsAt).toISOString().slice(0, 10)}`);

  const [event] = await db
    .insert(events)
    .values({
      title: parsed.title,
      slug,
      city: parsed.city,
      venueName: parsed.venueName,
      description: parsed.description,
      tier: parsed.tier,
      status: parsed.status,
      startsAt: new Date(parsed.startsAt),
      endsAt: new Date(parsed.endsAt),
      capacity: parsed.capacity,
      coverImageUrl: parsed.coverImageUrl || null,
    })
    .returning();

  await db.insert(ticketTiers).values({
    eventId: event.id,
    name: parsed.tierName,
    priceKes: parsed.tierPrice,
    maxQty: parsed.tierMaxQty,
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect(`/admin/events/${event.id}/edit`);
}

const updateSchema = eventSchema.omit({ tierName: true, tierPrice: true, tierMaxQty: true });

export async function updateEvent(eventId: string, formData: FormData) {
  await requireRole(["admin"]);

  const parsed = updateSchema.parse({
    title: formData.get("title"),
    city: formData.get("city"),
    venueName: formData.get("venueName") || undefined,
    description: formData.get("description") || undefined,
    tier: formData.get("tier"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity"),
    coverImageUrl: formData.get("coverImageUrl") || undefined,
  });

  await db
    .update(events)
    .set({
      title: parsed.title,
      city: parsed.city,
      venueName: parsed.venueName,
      description: parsed.description,
      tier: parsed.tier,
      status: parsed.status,
      startsAt: new Date(parsed.startsAt),
      endsAt: new Date(parsed.endsAt),
      capacity: parsed.capacity,
      coverImageUrl: parsed.coverImageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath("/events");
}

const tierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  priceKes: z.coerce.number().int().min(0),
  maxQty: z.coerce.number().int().min(1),
  description: z.string().optional(),
});

export async function upsertTier(eventId: string, formData: FormData) {
  await requireRole(["admin"]);

  const parsed = tierSchema.parse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    priceKes: formData.get("priceKes"),
    maxQty: formData.get("maxQty"),
    description: formData.get("description") || undefined,
  });

  if (parsed.id) {
    await db
      .update(ticketTiers)
      .set({
        name: parsed.name,
        priceKes: parsed.priceKes,
        maxQty: parsed.maxQty,
        description: parsed.description,
      })
      .where(eq(ticketTiers.id, parsed.id));
  } else {
    await db.insert(ticketTiers).values({
      eventId,
      name: parsed.name,
      priceKes: parsed.priceKes,
      maxQty: parsed.maxQty,
      description: parsed.description,
    });
  }

  revalidatePath(`/admin/events/${eventId}/edit`);
}

export async function deleteTier(eventId: string, tierId: string) {
  await requireRole(["admin"]);
  await db.delete(ticketTiers).where(eq(ticketTiers.id, tierId));
  revalidatePath(`/admin/events/${eventId}/edit`);
}
