import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/utils/public-origin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> },
) {
  const { dealId } = await params;
  const user = await requireUser();
  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId");

  await db.insert(schema.dateVaultRedemptions).values({
    dealId,
    userId: user.id,
    matchId: matchId ?? undefined,
    affiliateAttribution: { source: "evermore" } as Record<string, unknown>,
  });

  if (matchId) {
    await db
      .update(schema.matchBridgeUpsells)
      .set({ clickedAt: new Date(), claimedAt: new Date() })
      .where(eq(schema.matchBridgeUpsells.dealId, dealId));
  }

  return NextResponse.redirect(
    `${getPublicOrigin(req)}/date-vault/${dealId}/redeemed`,
  );
}
