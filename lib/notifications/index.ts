import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { sendWhatsApp } from "./whatsapp";

export async function notifyMutualMatch(opts: {
  matchId: string;
  userIds: string[];
}) {
  const profiles = await db
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, inArray(schema.profiles.userId, opts.userIds))
    .where(inArray(schema.users.id, opts.userIds));

  for (const p of profiles) {
    const html = `
      <div style="font-family:Inter,sans-serif;background:#380b38;color:#f3bbef;padding:24px;border-radius:24px">
        <p style="text-transform:uppercase;letter-spacing:.4em;font-size:11px;opacity:.7">Evermore</p>
        <h1 style="font-family:Georgia,serif;font-size:28px;margin:8px 0">It&rsquo;s a mutual match.</h1>
        <p>Both of you opted in. Look out for a Date Vault suggestion shortly.</p>
        <p style="font-size:12px;opacity:.7;margin-top:24px">Tap the app to see your match.</p>
      </div>`;
    await sendEmail({
      to: p.user.email,
      subject: "✨ Mutual match on Evermore",
      html,
    });
    if (p.profile?.phone) {
      await sendWhatsApp({
        to: p.profile.phone,
        body: "Mutual match on Evermore. Open the app to see your connection.",
      });
    }
  }
}

export async function notifyTicketConfirmed(opts: { userId: string; ticketCode: string }) {
  const [u] = await db
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, inArray(schema.profiles.userId, [opts.userId]))
    .where(inArray(schema.users.id, [opts.userId]));
  if (!u) return;
  await sendEmail({
    to: u.user.email,
    subject: "Your Evermore ticket is confirmed",
    html: `<p>Ticket <strong>${opts.ticketCode}</strong> is confirmed. Your alias will be revealed in the app.</p>`,
  });
  if (u.profile?.phone) {
    await sendSms({
      to: u.profile.phone,
      body: `Evermore: ticket ${opts.ticketCode} confirmed. Open the app for your alias.`,
    });
  }
}

export async function notifyPaymentReceived(opts: {
  userId: string;
  amount: string | number;
  currency: "KSH" | "USD";
  senderDisplayName?: string;
}) {
  // Internal: confirm to admin from the sender display name (no personal names).
  // eslint-disable-next-line no-console
  console.log(
    `[notify][payment] ${opts.senderDisplayName ?? "Evermore"} received ${opts.currency} ${opts.amount} for user ${opts.userId}`,
  );
}

export { sendEmail, sendSms, sendWhatsApp };
