import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { inngest } from "../client";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

// Daily 8am — nudge 3 days before installments come due.
export const installmentReminders = inngest.createFunction(
  {
    id: "installment-reminders",
    triggers: [{ cron: "0 8 * * *" }],
  },
  async () => {
    const threeDaysOut = new Date();
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    const due = await db
      .select({
        installment: schema.tripInstallments,
        booking: schema.tripBookings,
        profile: schema.profiles,
      })
      .from(schema.tripInstallments)
      .innerJoin(
        schema.tripBookings,
        eq(schema.tripBookings.id, schema.tripInstallments.bookingId),
      )
      .leftJoin(
        schema.profiles,
        eq(schema.profiles.userId, schema.tripBookings.primaryUserId),
      )
      .where(
        and(
          isNull(schema.tripInstallments.paidAt),
          isNull(schema.tripInstallments.reminderSentAt),
          gt(schema.tripInstallments.dueOn, new Date()),
          lt(schema.tripInstallments.dueOn, threeDaysOut),
        ),
      );

    for (const row of due) {
      if (row.profile?.phone) {
        await sendWhatsApp({
          to: row.profile.phone,
          body: `Evermore: your installment of ${row.installment.amount} ${row.booking.currency} is due in 3 days.`,
        });
      }
      await db
        .update(schema.tripInstallments)
        .set({ reminderSentAt: new Date() })
        .where(eq(schema.tripInstallments.id, row.installment.id));
    }
  },
);
