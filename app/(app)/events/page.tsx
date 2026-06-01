import { AppLink } from "@/components/nav/app-link";
import { and, eq, gte, count, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils/format";

export default async function PulseHub() {
  const user = await requireUser();
  const now = new Date();

  const isElite = user.tier === "elite";

  // Events visible to this tier.
  const rows = await db
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.status, "published"),
        gte(schema.events.startsAt, now),
        isElite ? sql`true` : eq(schema.events.eliteOnly, false),
      ),
    )
    .orderBy(schema.events.startsAt);

  // Active community pulse — count of non-banned users.
  const [{ value: ledger }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.banned, false));

  // Ticket counters (for "last 3 tickets" badge).
  const ticketCounters = await db
    .select({
      eventId: schema.eventTickets.eventId,
      total: sql<number>`sum(${schema.eventTickets.capacity})`,
      sold: sql<number>`sum(${schema.eventTickets.sold})`,
    })
    .from(schema.eventTickets)
    .groupBy(schema.eventTickets.eventId);
  const counterMap = Object.fromEntries(
    ticketCounters.map((r) => [
      r.eventId,
      { total: Number(r.total ?? 0), sold: Number(r.sold ?? 0) },
    ]),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Evermore Pulse</h1>
        <p className="text-sm text-plum-900/60">
          Curated retreats and mixers. Tickets in KSh or USD. Aliases assigned on
          purchase.
        </p>
      </header>

      <div className="rounded-3xl brand-card-dark p-5">
        <p className="text-xs uppercase tracking-[0.4em] opacity-70">
          The Social Ledger
        </p>
        <p
          className="text-display text-2xl mt-1"
          data-testid="pulse-ledger"
        >
          {Number(ledger).toLocaleString()} Souls connecting today
        </p>
        <p className="text-xs opacity-70 mt-1">
          A community number — never names.
        </p>
      </div>

      {rows.length === 0 && (
        <Card>
          <CardTitle>No upcoming events yet</CardTitle>
          <CardSubtitle>
            Our concierge is curating the next retreat. Check back soon.
          </CardSubtitle>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {rows.map((e) => {
          const c = counterMap[e.id] ?? { total: 0, sold: 0 };
          const remaining = Math.max(c.total - c.sold, 0);
          const last3 = remaining <= 3 && remaining > 0;
          return (
            <AppLink key={e.id} href={`/events/${e.slug}`} className="group block">
              <article className="overflow-hidden rounded-3xl bg-white shadow-sm border border-plum-900/8 hover:shadow-md transition">
                <div
                  className="h-48 bg-cover bg-center bg-plum-900"
                  style={{
                    backgroundImage: e.heroImageUrl
                      ? `url(${e.heroImageUrl})`
                      : undefined,
                  }}
                />
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2 flex-wrap">
                    <Badge tone="plum">{e.city ?? e.region ?? "TBA"}</Badge>
                    {e.eliteOnly && <Badge tone="amber">Elite-Only</Badge>}
                    {last3 && (
                      <Badge tone="amber" data-testid="last-tickets">
                        Only {remaining} left
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-display text-2xl text-plum-900 group-hover:underline">
                    {e.title}
                  </h3>
                  {e.subtitle && (
                    <p className="text-sm text-plum-900/60 mt-1">
                      {e.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-widest text-plum-900/50">
                    {formatDateRange(e.startsAt, e.endsAt)}
                  </p>
                </div>
              </article>
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}
