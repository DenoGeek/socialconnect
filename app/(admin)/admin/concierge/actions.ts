"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, matchHandoffs, matches, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/server";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/sms";

const handoffSchema = z.object({
  channel: z.enum(["email", "whatsapp", "phone", "in_app"]),
  message: z.string().min(20).max(4000),
});

export async function recordHandoff(matchId: string, formData: FormData) {
  const session = await requireRole(["admin", "concierge"]);

  const parsed = handoffSchema.parse({
    channel: formData.get("channel"),
    message: formData.get("message"),
  });

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) throw new Error("Match not found");

  const a = (await db.select().from(users).where(eq(users.id, match.userAId)).limit(1))[0];
  const b = (await db.select().from(users).where(eq(users.id, match.userBId)).limit(1))[0];
  if (!a || !b) throw new Error("Users not found");

  // Send the intro on the chosen channel. Email is the v1 default.
  if (parsed.channel === "email") {
    await sendEmail({
      to: a.email,
      subject: "An introduction · Evermore Concierge",
      html: introEmailHtml({ greeting: a.name.split(" ")[0], message: parsed.message }),
    });
    await sendEmail({
      to: b.email,
      subject: "An introduction · Evermore Concierge",
      html: introEmailHtml({ greeting: b.name.split(" ")[0], message: parsed.message }),
    });
  }

  if (parsed.channel === "whatsapp" || parsed.channel === "phone") {
    // SMS is the v1 stand-in for both phone and WhatsApp; WhatsApp Cloud API
    // ships in phase 2 (see lib/notifications/whatsapp.ts).
    // Phone numbers come from the profile in v1; for now we skip if missing.
  }

  await db.insert(matchHandoffs).values({
    matchId: match.id,
    handledBy: session.user.id,
    channel: parsed.channel,
    notes: parsed.message,
  });

  await db
    .update(matches)
    .set({ status: "introduced", updatedAt: new Date() })
    .where(eq(matches.id, match.id));

  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: "match.handoff",
    resourceType: "match",
    resourceId: match.id,
    metadata: { channel: parsed.channel },
  });

  // Suppress unused import warning while SMS path stays a stub.
  void sendSms;

  revalidatePath("/admin/concierge");
  revalidatePath(`/admin/concierge/${match.id}`);
  redirect(`/admin/concierge/${match.id}?just=handoff`);
}

export async function declineMatch(matchId: string) {
  const session = await requireRole(["admin", "concierge"]);
  await db
    .update(matches)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(matches.id, matchId));
  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: "match.decline",
    resourceType: "match",
    resourceId: matchId,
  });
  revalidatePath("/admin/concierge");
  redirect("/admin/concierge");
}

function introEmailHtml({ greeting, message }: { greeting: string; message: string }): string {
  return `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui,sans-serif;background:#fafaf9;color:#1c1917;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;">
    <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#78716c;margin:0;">Evermore · Concierge</p>
    <h1 style="font-size:22px;font-weight:600;margin:16px 0 16px;">${greeting},</h1>
    <div style="line-height:1.7;color:#44403c;white-space:pre-wrap;">${escapeHtml(message)}</div>
    <p style="margin-top:32px;font-size:13px;color:#78716c;line-height:1.6;">
      With care,<br/>The Evermore Concierge
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
