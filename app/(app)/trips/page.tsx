import { AppLink } from "@/components/nav/app-link";
import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatMoney } from "@/lib/utils/format";

export default async function Trips({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; curriculum?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const filters = [
    eq(schema.trips.active, true),
    gte(schema.trips.endsOn, new Date()),
  ];
  if (sp.scope) filters.push(eq(schema.trips.scope, sp.scope as never));
  if (sp.curriculum === "1")
    filters.push(eq(schema.trips.curriculumIncluded, true));

  const rows = await db.select().from(schema.trips).where(and(...filters));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Bespoke Trips</h1>
        <p className="text-sm text-plum-900/60">
          Group or private. Installments at checkout.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <AppLink
          href="/trips"
          className={`rounded-full px-3 py-1.5 ${!sp.scope ? "bg-plum-900 text-plum-100" : "bg-plum-900/5"}`}
        >
          All
        </AppLink>
        <AppLink
          href="/trips?scope=group"
          className={`rounded-full px-3 py-1.5 ${sp.scope === "group" ? "bg-plum-900 text-plum-100" : "bg-plum-900/5"}`}
        >
          Group
        </AppLink>
        <AppLink
          href="/trips?scope=private"
          className={`rounded-full px-3 py-1.5 ${sp.scope === "private" ? "bg-plum-900 text-plum-100" : "bg-plum-900/5"}`}
        >
          Private
        </AppLink>
        <AppLink
          href="/trips?curriculum=1"
          className={`rounded-full px-3 py-1.5 ${sp.curriculum === "1" ? "bg-plum-900 text-plum-100" : "bg-plum-900/5"}`}
        >
          With curriculum
        </AppLink>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rows.map((t) => (
          <AppLink key={t.id} href={`/trips/${t.slug}`}>
            <article className="rounded-3xl overflow-hidden bg-white border border-plum-900/8 shadow-sm hover:shadow-md transition">
              <div
                className="h-44 bg-cover bg-center bg-plum-900"
                style={{
                  backgroundImage: t.gallery?.[0]
                    ? `url(${t.gallery[0]})`
                    : undefined,
                }}
              />
              <div className="p-4">
                <div className="flex gap-2 flex-wrap mb-1">
                  <Badge tone="plum">{t.scope}</Badge>
                  {t.curriculumIncluded && (
                    <Badge tone="mint">Marriage curriculum</Badge>
                  )}
                  {t.facilitatorIncluded && (
                    <Badge tone="teal">Facilitator</Badge>
                  )}
                </div>
                <h3 className="text-display text-lg text-plum-900">{t.title}</h3>
                <p className="text-xs text-plum-900/60 mt-1">
                  {formatDateRange(t.startsOn, t.endsOn)} · {t.region}
                </p>
                <p className="text-sm text-plum-900 mt-2">
                  {formatMoney(t.totalUsd, "USD")} or{" "}
                  {formatMoney(t.totalKsh, "KSH")}
                </p>
              </div>
            </article>
          </AppLink>
        ))}
      </div>
    </div>
  );
}
