import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getKesPerUsd } from "@/lib/currency/convert";
import { EventEditor } from "@/components/admin/event-editor";
import { addTicket, updateEvent } from "../../actions";

export default async function EditEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [e] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  if (!e) notFound();

  const tickets = await db
    .select()
    .from(schema.eventTickets)
    .where(eq(schema.eventTickets.eventId, e.id))
    .orderBy(asc(schema.eventTickets.tier));

  const rate = await getKesPerUsd();

  return (
    <EventEditor
      event={{
        id: e.id,
        title: e.title,
        subtitle: e.subtitle,
        city: e.city,
        venue: e.venue,
        description: e.description,
        heroImageUrl: e.heroImageUrl,
        capacity: e.capacity,
        eliteOnly: e.eliteOnly,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        status: e.status,
        itinerary: (e.itinerary ?? []) as {
          time: string;
          label: string;
          detail?: string;
        }[],
      }}
      tickets={tickets.map((t) => ({
        id: t.id,
        label: t.label,
        tier: t.tier,
        priceKsh: t.priceKsh,
        priceUsd: t.priceUsd,
        sold: t.sold,
        capacity: t.capacity,
      }))}
      kesPerUsd={rate.kesPerUsd}
      rateSource={rate.source}
      rateFetchedAt={rate.fetchedAt.toISOString()}
      updateAction={updateEvent}
      addTicketAction={addTicket}
    />
  );
}
