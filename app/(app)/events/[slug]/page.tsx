import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketPurchases, ticketTiers } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatKes } from "@/lib/utils/format";
import { getSession } from "@/lib/auth/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) notFound();

  const tiers = await db
    .select()
    .from(ticketTiers)
    .where(eq(ticketTiers.eventId, event.id));

  const userTicket = session
    ? (
        await db
          .select()
          .from(ticketPurchases)
          .where(
            and(
              eq(ticketPurchases.userId, session.user.id),
              eq(ticketPurchases.eventId, event.id),
              inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
            ),
          )
          .limit(1)
      )[0]
    : null;

  const itineraryItems =
    Array.isArray(event.itinerary) ? (event.itinerary as Array<{ time: string; title: string; detail?: string }>) : [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <Link href="/events" className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900">
        ← Back to events
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="muted">{event.tier.replace("_", " ")}</Badge>
          {event.status === "sold_out" && <Badge variant="warning">Sold out</Badge>}
          <span className="text-sm text-stone-500">{event.city}</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-sm text-stone-600">
          {formatEventDate(event.startsAt, event.endsAt)}
          {event.venueName ? ` · ${event.venueName}` : ""}
        </p>
      </header>

      {event.coverImageUrl && (
        <div
          className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-stone-200 bg-cover bg-center"
          style={{ backgroundImage: `url("${event.coverImageUrl}")` }}
        />
      )}

      <section className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <article className="flex flex-col gap-6">
          {event.description && (
            <p className="whitespace-pre-line text-base leading-relaxed text-stone-700">
              {event.description}
            </p>
          )}

          {userTicket ? (
            <Card>
              <CardHeader>
                <CardTitle>Your itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                {itineraryItems.length === 0 ? (
                  <p className="text-sm text-stone-500">Itinerary will be posted closer to the date.</p>
                ) : (
                  <ol className="flex flex-col gap-4">
                    {itineraryItems.map((item, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-stone-500">
                          {item.time}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.detail && <p className="text-sm text-stone-600">{item.detail}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Itinerary unlocks at purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600">
                  We share the full schedule, venue address, and partner details once your ticket
                  is confirmed. Mystery is part of the design.
                </p>
              </CardContent>
            </Card>
          )}
        </article>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {tiers.length === 0 ? (
                <p className="text-sm text-stone-500">Ticket tiers coming soon.</p>
              ) : (
                tiers.map((tier) => {
                  const remaining = tier.maxQty - tier.soldQty;
                  const soldOut = remaining <= 0 || event.status === "sold_out";
                  return (
                    <div
                      key={tier.id}
                      className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{tier.name}</p>
                        {tier.description && (
                          <p className="text-xs text-stone-500">{tier.description}</p>
                        )}
                        <p className="mt-1 text-xs text-stone-500">
                          {soldOut ? "Sold out" : `${remaining} left`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-base font-medium">{formatKes(tier.priceKes)}</span>
                        {userTicket ? (
                          <Badge variant="success">You're in</Badge>
                        ) : !session ? (
                          <Button asChild size="sm" disabled={soldOut}>
                            <Link href={`/login?redirect=/events/${event.slug}`}>Sign in to buy</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" disabled={soldOut}>
                            <Link href={`/events/${event.slug}/buy?tier=${tier.id}`}>
                              {soldOut ? "Sold out" : "Buy ticket"}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
