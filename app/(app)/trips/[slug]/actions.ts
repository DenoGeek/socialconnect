"use server";

import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function bookTrip(form: FormData) {
  const user = await requireUser();
  const tripId = String(form.get("tripId"));
  const currency = String(form.get("currency")) as "USD" | "KSH";
  const total = Number(form.get("total"));
  const installmentMonths = Number(form.get("installmentMonths") ?? 1);

  const [b] = await db
    .insert(schema.tripBookings)
    .values({
      tripId,
      primaryUserId: user.id,
      currency,
      total: String(total),
      installmentMonths,
    })
    .returning();

  // Generate installments.
  const monthly = total / installmentMonths;
  const now = new Date();
  for (let i = 0; i < installmentMonths; i++) {
    const due = new Date(now);
    due.setMonth(due.getMonth() + i);
    await db.insert(schema.tripInstallments).values({
      bookingId: b.id,
      dueOn: due,
      amount: monthly.toFixed(2),
    });
  }

  redirect(`/trips/me/${b.id}`);
}
