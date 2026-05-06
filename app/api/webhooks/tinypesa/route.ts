import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { tinypesa } from "@/lib/payments/tinypesa";

/**
 * TinyPesa callback endpoint. Configure this URL in your TinyPesa dashboard.
 *
 * Security: TinyPesa does not document a signed-webhook scheme on the free
 * tier, so we apply two defenses here:
 *   1) A shared-secret query token (TINYPESA_WEBHOOK_SECRET) appended to the
 *      callback URL configured in their dashboard.
 *   2) The endpoint is idempotent — receiving the same callback twice is
 *      a no-op once the payment row is settled.
 *
 * If TinyPesa later adds HMAC, add the verification step inside parseWebhook
 * and read the header here. The contract does not need to change.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const expected = process.env.TINYPESA_WEBHOOK_SECRET;
  if (expected) {
    const provided = url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret");
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const rawBody = await req.text();
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const result = await tinypesa.parseWebhook({ rawBody, headers: headersObj });

  if (!result.providerRef) {
    return NextResponse.json({ ok: false, reason: "missing_provider_ref" }, { status: 200 });
  }

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, result.providerRef))
    .limit(1);

  if (!row) {
    // Webhook arrived before our initiate row is committed — TinyPesa retries.
    return NextResponse.json({ ok: false, reason: "payment_not_found" }, { status: 202 });
  }

  if (row.status === "succeeded" || row.status === "refunded") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  await db
    .update(payments)
    .set({
      status: result.status,
      rawCallback: result.raw as never,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, row.id));

  // TODO: Inngest event emit (purchase.settled / booking.settled / ...) so
  // domain code can react to settled payments without coupling to webhooks.

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "tinypesa-webhook" });
}
