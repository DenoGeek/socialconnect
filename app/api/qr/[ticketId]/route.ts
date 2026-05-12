import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  const user = await requireUser();
  const [t] = await db
    .select()
    .from(schema.ticketPurchases)
    .where(eq(schema.ticketPurchases.id, ticketId))
    .limit(1);
  if (!t || t.userId !== user.id) {
    return new NextResponse("Not found", { status: 404 });
  }
  const png = await QRCode.toBuffer(t.qrToken, {
    width: 480,
    margin: 1,
    color: { dark: "#380b38", light: "#fbf3fb" },
  });
  const body = new Uint8Array(png);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
    },
  });
}
