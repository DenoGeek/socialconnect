"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { sendSms } from "@/lib/notifications/sms";
import {
  createInAppNotification,
  notifyPanicToAdmins,
} from "@/lib/notifications/in-app";

export async function reportMember(form: FormData) {
  const user = await requireUser();
  const reportedUserId = String(form.get("reportedUserId"));
  const reason = String(form.get("reason") ?? "").trim();
  if (!reportedUserId || !reason) throw new Error("Reason required");
  if (reportedUserId === user.id) throw new Error("Cannot report yourself");

  await db.insert(schema.userReports).values({
    reporterUserId: user.id,
    reportedUserId,
    reason,
  });

  try {
    await db.insert(schema.matchExclusions).values({
      userAId: user.id,
      userBId: reportedUserId,
      reason: `report: ${reason}`,
      permanent: false,
    });
  } catch {
    // Pair may already be excluded.
  }

  revalidatePath("/safety");
  revalidatePath("/matches");
  revalidatePath("/admin/flags");
}

export async function triggerPanicAlert(form: FormData) {
  const user = await requireUser();
  const note = String(form.get("note") ?? "").trim();

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  await db.insert(schema.panicAlerts).values({
    userId: user.id,
    note: note || null,
  });

  await notifyPanicToAdmins({
    memberName: user.name,
    memberEmail: user.email,
    note,
  });

  if (profile?.emergencyContactPhone) {
    await sendSms({
      to: profile.emergencyContactPhone,
      body: `Agano Evermore emergency alert from ${user.name}. Please check on them. Note: ${note || "none"}`,
    });
  }

  await createInAppNotification({
    userId: user.id,
    kind: "safety",
    title: "Emergency alert sent",
    body: "Admins and your emergency contact (if set) have been notified.",
    href: "/safety",
  });

  revalidatePath("/safety");
  revalidatePath("/admin/flags");
}

export async function updateEmergencyContact(form: FormData) {
  const user = await requireUser();
  await db
    .update(schema.profiles)
    .set({
      emergencyContactName:
        String(form.get("emergencyContactName") ?? "").trim() || null,
      emergencyContactPhone:
        String(form.get("emergencyContactPhone") ?? "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, user.id));
  revalidatePath("/safety");
  revalidatePath("/account");
}
