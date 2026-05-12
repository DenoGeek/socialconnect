"use server";

import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function bookProperty(form: FormData) {
  const user = await requireUser();
  const propertyId = String(form.get("propertyId"));
  const checkIn = new Date(String(form.get("checkIn")));
  const checkOut = new Date(String(form.get("checkOut")));
  const rooms = Number(form.get("rooms") ?? 1);
  const adults = Number(form.get("adults") ?? 2);
  const currency = String(form.get("currency")) as "KSH" | "USD";
  const subtotal = Number(form.get("subtotal"));
  const total = Number(form.get("total"));
  const addOnIds = JSON.parse(String(form.get("addOns") ?? "[]")) as string[];

  const addOns = addOnIds.length
    ? await db
        .select()
        .from(schema.propertyAddOns)
        .where(inArray(schema.propertyAddOns.id, addOnIds))
    : [];

  const [b] = await db
    .insert(schema.hearthBookings)
    .values({
      propertyId,
      primaryUserId: user.id,
      rooms,
      adults,
      checkIn,
      checkOut,
      currency,
      subtotal: subtotal.toString(),
      total: total.toString(),
      addOns: addOns.map((a) => ({
        id: a.id,
        name: a.name,
        price: Number(currency === "KSH" ? a.priceKsh : a.priceUsd),
      })),
      status: "confirmed",
    })
    .returning();

  // Issue key code 24 hours before arrival — for now, generate stub.
  const code = Math.random().toString(36).slice(-6).toUpperCase();
  await db
    .update(schema.hearthBookings)
    .set({ keyCode: code, keyCodeIssuedAt: new Date() })
    .where(eq(schema.hearthBookings.id, b.id));

  redirect(`/residential/me/${b.id}`);
}
