import Link from "next/link";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketTiers } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatKes } from "@/lib/utils/format";

export const metadata = { title: "Events · Evermore" };

interface PageProps {
  searchParams: Promise<{ city?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();

  const baseFilter = and(
    inArray(events.status, ["published", "sold_out"] as const),
    gte(events.endsAt, now),
  );
  const where = sp.city ? and(baseFilter, eq(events.city, sp.city)) : baseFilter;

  const upcoming = await db.select().from(events).where(where).orderBy(asc(events.startsAt));

  const eventIds = upcoming.map((e) => e.id);
  const tierRows = eventIds.length
    ? await db
        .select({
          eventId: ticketTiers.eventId,
          minPrice: sql<number>`min(${ticketTiers.priceKes})`,
        })
        .from(ticketTiers)
        .where(inArray(ticketTiers.eventId, eventIds))
        .groupBy(ticketTiers.eventId)
    : [];
  const minPriceByEvent = new Map(tierRows.map((r) => [r.eventId, Number(r.minPrice)]));

  const cities = Array.from(new Set(upcoming.map((e) => e.city))).sort();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Discovery</span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Upcoming retreats and gatherings
        </h1>
        <p className="max-w-xl text-sm text-stone-600">
          A small, curated calendar. Each event is built around an experience — alias-aware,
          intentionally quiet, designed for connection.
        </p>
      </header>

      {cities.length > 1 && (
        <nav className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/events"
            className={`rounded-full border px-3 py-1 transition-colors ${
              !sp.city
                ? "border-stone-900 bg-stone-900 text-stone-50"
                : "border-stone-300 text-stone-700 hover:border-stone-500"
            }`}
          >
            All cities
          </Link>
          {cities.map((c) => (
            <Link
              key={c}
              href={`/events?city=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3 py-1 transition-colors ${
                sp.city === c
                  ? "border-stone-900 bg-stone-900 text-stone-50"
                  : "border-stone-300 text-stone-700 hover:border-stone-500"
              }`}
            >
              {c}
            </Link>
          ))}
        </nav>
      )}

      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-stone-500">No upcoming events yet. Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => {
            const min = minPriceByEvent.get(event.id);
            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition-colors hover:border-stone-400"
                >
                  <div
                    className="aspect-[4/3] bg-stone-200 bg-cover bg-center"
                    style={{
                      backgroundImage: event.coverImageUrl
                        ? `url("${event.coverImageUrl}")`
                        : undefined,
                    }}
                  />
                  <div className="flex flex-col gap-2 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-wide text-stone-500">
                        {event.city}
                      </span>
                      {event.status === "sold_out" && (
                        <Badge variant="warning">Sold out</Badge>
                      )}
                    </div>
                    <h2 className="text-lg font-medium tracking-tight group-hover:text-stone-700">
                      {event.title}
                    </h2>
                    <p className="text-sm text-stone-600">
                      {formatEventDate(event.startsAt, event.endsAt)}
                    </p>
                    {min !== undefined && (
                      <p className="mt-2 text-sm text-stone-700">
                        From <span className="font-medium">{formatKes(min)}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
