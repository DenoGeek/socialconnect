import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail } from "./email";

export async function createInAppNotification(opts: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  href?: string;
}) {
  const [row] = await db
    .insert(schema.inAppNotifications)
    .values({
      userId: opts.userId,
      kind: opts.kind,
      title: opts.title,
      body: opts.body,
      href: opts.href,
    })
    .returning();
  return row;
}

export async function prefsAllow(
  userId: string,
  channel: "email" | "sms" | "inApp" | "matches" | "events" | "community",
) {
  const [profile] = await db
    .select({ prefs: schema.profiles.notificationPrefs })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);
  const prefs = profile?.prefs ?? {};
  return prefs[channel] !== false;
}

export async function notifyWarning(opts: {
  userId: string;
  email: string;
  message: string;
}) {
  await createInAppNotification({
    userId: opts.userId,
    kind: "warning",
    title: "Account warning",
    body: opts.message,
    href: "/account",
  });
  if (await prefsAllow(opts.userId, "email")) {
    await sendEmail({
      to: opts.email,
      subject: "Important notice from Agano Evermore",
      html: `<p>${opts.message}</p><p>Please review the community guidelines in your account.</p>`,
    });
  }
}

export async function notifyPanicToAdmins(opts: {
  memberName: string;
  memberEmail: string;
  note?: string | null;
}) {
  const admins = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  const supers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "super_admin"));
  const staff = [...admins, ...supers];
  for (const a of staff) {
    await createInAppNotification({
      userId: a.id,
      kind: "safety",
      title: `Panic alert · ${opts.memberName}`,
      body: opts.note || "Member triggered the emergency protocol.",
      href: "/admin/flags",
    });
    await sendEmail({
      to: a.email,
      subject: `[URGENT] Panic alert — ${opts.memberName}`,
      html: `<p><strong>${opts.memberName}</strong> (${opts.memberEmail}) triggered an emergency alert.</p><p>${opts.note ?? ""}</p>`,
    });
  }
}
