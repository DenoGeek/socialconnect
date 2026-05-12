import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params;
  const user = await requireUser();
  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);
  if (!pay || pay.userId !== user.id) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.json({
    id: pay.id,
    status: pay.status,
    amount: pay.amount,
    currency: pay.currency,
  });
}
