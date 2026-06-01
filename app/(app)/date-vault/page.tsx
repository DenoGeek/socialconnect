import { AppLink } from "@/components/nav/app-link";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";

export default async function DateVault() {
  await requireUser();
  const now = new Date();
  const rows = await db
    .select({
      deal: schema.dateVaultDeals,
      partner: schema.datePartners,
    })
    .from(schema.dateVaultDeals)
    .innerJoin(
      schema.datePartners,
      eq(schema.datePartners.id, schema.dateVaultDeals.partnerId),
    )
    .where(
      and(
        eq(schema.dateVaultDeals.active, true),
        eq(schema.datePartners.active, true),
        or(
          isNull(schema.dateVaultDeals.expiresAt),
          gt(schema.dateVaultDeals.expiresAt, now),
        ),
      ),
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Date Vault</h1>
        <p className="text-sm text-plum-900/60">
          Curated experiences with exclusive Agano member pricing.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ deal, partner }) => (
          <AppLink key={deal.id} href={`/date-vault/${deal.id}`}>
            <article className="rounded-3xl overflow-hidden bg-white border border-plum-900/8 shadow-sm hover:shadow-md transition">
              <div
                className="h-40 bg-cover bg-center bg-plum-900"
                style={{
                  backgroundImage: deal.thumbnail
                    ? `url(${deal.thumbnail})`
                    : undefined,
                }}
              />
              <div className="p-4">
                <Badge tone="neutral">{partner.category}</Badge>
                <h3 className="text-display text-lg text-plum-900 mt-1">
                  {deal.title}
                </h3>
                <p className="text-xs text-plum-900/60">
                  {partner.name} · {partner.city}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {deal.originalPriceKsh && (
                    <span className="line-through text-plum-900/40">
                      {formatMoney(deal.originalPriceKsh, "KSH")}
                    </span>
                  )}
                  {deal.memberPriceKsh && (
                    <span className="text-plum-900 font-medium">
                      {formatMoney(deal.memberPriceKsh, "KSH")}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </AppLink>
        ))}
        {rows.length === 0 && (
          <Card>
            <CardTitle>Vault is quiet today</CardTitle>
            <CardSubtitle>New deals are added by the Concierge weekly.</CardSubtitle>
          </Card>
        )}
      </div>
    </div>
  );
}
