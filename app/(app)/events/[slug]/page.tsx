import { AppLink } from "@/components/nav/app-link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatMoney } from "@/lib/utils/format";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, slug))
    .limit(1);
  if (!event) notFound();

  const tickets = await db
    .select()
    .from(schema.eventTickets)
    .where(
      and(
        eq(schema.eventTickets.eventId, event.id),
        eq(schema.eventTickets.active, true),
      ),
    );

  return (
    <article className="space-y-8">
      <div
        className="rounded-3xl h-72 bg-cover bg-center bg-plum-900"
        style={{
          backgroundImage: event.heroImageUrl
            ? `url(${event.heroImageUrl})`
            : undefined,
        }}
      />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Badge tone="plum">{event.city ?? "TBA"}</Badge>
          {event.eliteOnly && (
            <Badge tone="amber" className="ml-2">
              Elite-Only
            </Badge>
          )}
          <h1 className="text-display text-4xl text-plum-900 mt-3">
            {event.title}
          </h1>
          {event.subtitle && (
            <p className="text-plum-900/60 mt-1">{event.subtitle}</p>
          )}
          <p className="mt-3 text-xs uppercase tracking-widest text-plum-900/50">
            {formatDateRange(event.startsAt, event.endsAt)} · {event.venue}
          </p>
        </div>
      </div>

      {event.description && (
        <Card>
          <p className="text-sm text-plum-900/80 whitespace-pre-line">
            {event.description}
          </p>
        </Card>
      )}

      <section>
        <h2 className="text-display text-2xl text-plum-900 mb-4">Itinerary</h2>
        <Card>
          {Array.isArray(event.itinerary) && event.itinerary.length > 0 ? (
            <ol className="divide-y divide-plum-900/8">
              {event.itinerary.map((i, idx) => (
                <li
                  key={idx}
                  className="flex gap-4 py-3 text-sm"
                  data-testid="itinerary-row"
                >
                  <span className="font-mono text-plum-900/60 w-20 shrink-0">
                    {i.time}
                  </span>
                  <span className="text-plum-900">
                    <span className="font-medium">{i.label}</span>
                    {i.detail && (
                      <span className="block text-plum-900/60">{i.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <CardSubtitle>Itinerary published on ticket purchase.</CardSubtitle>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-display text-2xl text-plum-900 mb-4">Tickets</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((t) => {
            const remaining = Math.max(t.capacity - t.sold, 0);
            const last3 = remaining <= 3 && remaining > 0;
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{t.label}</CardTitle>
                    <CardSubtitle>
                      {formatMoney(t.priceKsh, "KSH")} ·{" "}
                      {formatMoney(t.priceUsd, "USD")}
                    </CardSubtitle>
                  </div>
                  {last3 && <Badge tone="amber">Only {remaining} left</Badge>}
                </div>
                <AppLink
                  href={`/events/${event.slug}/buy?ticketId=${t.id}`}
                  className="block mt-4"
                >
                  <Button className="w-full">Purchase</Button>
                </AppLink>
              </Card>
            );
          })}
          {tickets.length === 0 && (
            <CardSubtitle>Tickets not yet on sale.</CardSubtitle>
          )}
        </div>
      </section>

      {Array.isArray(event.gallery) && event.gallery.length > 0 && (
        <section>
          <h2 className="text-display text-2xl text-plum-900 mb-4">Gallery</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {event.gallery.map((src, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-cover bg-center bg-plum-900/10"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
