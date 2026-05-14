"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function quickChat(form: FormData) {
  const user = await requireUser();
  const professionalId = String(form.get("professionalId"));
  const question = String(form.get("question") ?? "").trim();
  if (!question) return;
  await db
    .insert(schema.professionalQuickChats)
    .values({ professionalId, userId: user.id, question });
}

export async function bookSession(form: FormData) {
  const user = await requireUser();
  const professionalId = String(form.get("professionalId"));
  const availabilityId = String(form.get("availabilityId"));

  await db
    .update(schema.professionalAvailability)
    .set({ booked: true })
    .where(eq(schema.professionalAvailability.id, availabilityId));

  const [b] = await db
    .insert(schema.professionalBookings)
    .values({
      professionalId,
      availabilityId,
      primaryUserId: user.id,
      videoLink: `https://meet.evermore.co.ke/${availabilityId}`,
    })
    .returning();
  redirect(`/professionals/${professionalId}/booking/${b.id}`);
}

export async function confirmPayment(form: FormData) {
  await requireUser();
  const bookingId = String(form.get("bookingId"));
  await db
    .update(schema.professionalBookings)
    .set({ paymentConfirmedAt: new Date() })
    .where(eq(schema.professionalBookings.id, bookingId));
}
