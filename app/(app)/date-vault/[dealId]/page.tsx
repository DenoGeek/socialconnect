import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";

export default async function DealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  await requireUser();
  const [row] = await db
    .select({
      deal: schema.dateVaultDeals,
      partner: schema.datePartners,
    })
    .from(schema.dateVaultDeals)
    .innerJoin(
      schema.datePartners,
      eq(schema.datePartners.id, schema.dateVaultDeals.partnerId),
    )
    .where(eq(schema.dateVaultDeals.id, dealId))
    .limit(1);
  if (!row) notFound();

  const { deal, partner } = row;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <Badge tone="amber">Member exclusive</Badge>
        <h1 className="text-display text-4xl text-plum-900 mt-2">
          {deal.title}
        </h1>
        <p className="text-sm text-plum-900/60 mt-1">
          {partner.name} · {partner.city}
        </p>
      </header>

      {deal.description && (
        <Card>
          <p className="text-sm text-plum-900/80 whitespace-pre-line">
            {deal.description}
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Member pricing</CardTitle>
        <div className="flex items-baseline gap-3 mt-2">
          {deal.originalPriceKsh && (
            <span className="line-through text-plum-900/40">
              {formatMoney(deal.originalPriceKsh, "KSH")}
            </span>
          )}
          {deal.memberPriceKsh && (
            <span className="text-display text-2xl text-plum-900">
              {formatMoney(deal.memberPriceKsh, "KSH")}
            </span>
          )}
        </div>
        {deal.discountCode && (
          <CardSubtitle className="mt-3">
            Code at venue: <strong>{deal.discountCode}</strong>
          </CardSubtitle>
        )}
      </Card>

      <form action={`/date-vault/${deal.id}/redeem`} method="POST">
        <Button className="w-full" size="lg">
          Swipe to redeem
        </Button>
      </form>
    </div>
  );
}
