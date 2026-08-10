"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { canDowngradeWithoutPenalty } from "@/lib/membership/zahari-status";

export async function updateAccountProfile(form: FormData) {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const locationPreferences = String(form.get("locationPreferences") ?? "").trim();

  if (name) {
    await db
      .update(schema.users)
      .set({ name, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  }

  await db
    .update(schema.profiles)
    .set({
      phone: phone || null,
      locationPreferences: locationPreferences || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, user.id));

  revalidatePath("/account");
}

export async function updatePrivacySettings(form: FormData) {
  const user = await requireUser();
  const matchmakingVisible = form.get("matchmakingVisible") === "on";
  const isPublic = form.get("isPublic") === "on";

  await db
    .update(schema.profiles)
    .set({
      matchmakingVisible,
      isPublic,
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, user.id));

  revalidatePath("/account");
}

export async function updateNotificationPrefs(form: FormData) {
  const user = await requireUser();
  await db
    .update(schema.profiles)
    .set({
      notificationPrefs: {
        email: form.get("email") === "on",
        sms: form.get("sms") === "on",
        inApp: form.get("inApp") === "on",
        matches: form.get("matches") === "on",
        events: form.get("events") === "on",
        community: form.get("community") === "on",
      },
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, user.id));

  revalidatePath("/account");
}

export async function toggleAutoRenew(form: FormData) {
  const user = await requireUser();
  const enabled = form.get("autoRenew") === "on";
  await db
    .update(schema.zahariEngagements)
    .set({ autoRenew: enabled, updatedAt: new Date() })
    .where(eq(schema.zahariEngagements.userId, user.id));
  revalidatePath("/account");
}

export async function addPaymentMethod(form: FormData) {
  const user = await requireUser();
  const phone = String(form.get("mpesaPhone") ?? "").trim();
  const label = String(form.get("label") ?? "M-Pesa").trim() || "M-Pesa";
  if (!phone) throw new Error("Phone number required");

  await db.insert(schema.paymentMethods).values({
    userId: user.id,
    kind: "mpesa_phone",
    label,
    mpesaPhone: phone,
    isDefault: true,
  });

  revalidatePath("/account");
}

export async function removePaymentMethod(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("methodId"));
  await db
    .delete(schema.paymentMethods)
    .where(
      and(
        eq(schema.paymentMethods.id, id),
        eq(schema.paymentMethods.userId, user.id),
      ),
    );
  revalidatePath("/account");
}

/** End paid Zahari — no refund; lose elite perks. */
export async function cancelZahariSubscription(form: FormData) {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng?.sovereignPaidAt) {
    throw new Error("No active paid subscription to cancel");
  }

  await db
    .update(schema.zahariEngagements)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: String(form.get("reason") ?? "Member ended subscription"),
      autoRenew: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.zahariEngagements.id, eng.id));

  // Downgrade pathway to Amari and strip elite tier.
  await db
    .update(schema.users)
    .set({
      pathway: "amari",
      tier: "explorer",
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/account");
  redirect("/account?ended=1");
}

/** Pre-payment switch to Amari — no consequences. */
export async function downgradeToAmari() {
  const user = await requireUser();
  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);

  if (eng && !canDowngradeWithoutPenalty(eng)) {
    throw new Error(
      "Paid Zahari memberships must be ended (no refund) rather than freely downgraded.",
    );
  }

  if (eng) {
    await db
      .update(schema.zahariEngagements)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Switched to Amari before payment",
        autoRenew: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.zahariEngagements.id, eng.id));

    await db
      .update(schema.payments)
      .set({ status: "failed" })
      .where(
        and(
          eq(schema.payments.subjectId, eng.id),
          ne(schema.payments.status, "succeeded"),
        ),
      );
  }

  await db
    .update(schema.users)
    .set({
      pathway: "amari",
      tier: "explorer",
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/account");
  redirect("/account?downgraded=1");
}
