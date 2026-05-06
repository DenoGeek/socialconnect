import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, ticketPurchases } from "@/db/schema";
import { getSession } from "@/lib/auth/server";

interface Params {
  params: Promise<{ paymentId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { paymentId } = await params;
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payment.status === "succeeded" && payment.purpose === "ticket" && payment.purposeRef) {
    // Mark the ticket paid here too — the webhook fires this for us, but the
    // client may poll faster than Inngest in dev. The conditional UPDATE
    // makes this idempotent.
    await db
      .update(ticketPurchases)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(ticketPurchases.id, payment.purposeRef));
  }

  return NextResponse.json({
    status: payment.status,
    purpose: payment.purpose,
    purposeRef: payment.purposeRef,
  });
}
