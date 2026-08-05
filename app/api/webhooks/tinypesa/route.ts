import { NextResponse } from "next/server";
import { markPaymentSucceeded } from "@/lib/payments";
import { inngest } from "@/inngest/client";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { notifyPaymentReceived } from "@/lib/notifications";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (
    process.env.TINYPESA_WEBHOOK_SECRET &&
    secret !== process.env.TINYPESA_WEBHOOK_SECRET
  ) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const providerRef = (body.request_id as string) ?? (body.transaction_id as string);
  const status = (body.status as string) ?? "succeeded";

  // Match payment by providerRef.
  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.providerRef, providerRef ?? ""))
    .limit(1);
  if (!pay) {
    return NextResponse.json({ ok: true, matched: false });
  }

  // Persist webhook payload for admin payment feed / reconciliation.
  await db
    .update(schema.payments)
    .set({ rawWebhook: body })
    .where(eq(schema.payments.id, pay.id));

  if (status === "succeeded" || status === "ok") {
    await markPaymentSucceeded(pay.id, providerRef);
    await notifyPaymentReceived({
      userId: pay.userId,
      amount: pay.amount,
      currency: pay.currency,
      senderDisplayName: pay.senderDisplayName,
    });

    if (pay.subjectKind === "ticket") {
      const [tp] = await db
        .select()
        .from(schema.ticketPurchases)
        .where(eq(schema.ticketPurchases.id, pay.subjectId))
        .limit(1);
      if (tp) {
        await inngest.send({
          name: "ticket.purchased",
          data: {
            ticketPurchaseId: tp.id,
            userId: tp.userId,
            eventId: tp.eventId,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
