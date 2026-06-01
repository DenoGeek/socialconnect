import { AppLink } from "@/components/nav/app-link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils/format";

export default async function MyEvents() {
  const user = await requireUser();
  const purchases = await db
    .select({
      purchase: schema.ticketPurchases,
      event: schema.events,
      ticket: schema.eventTickets,
    })
    .from(schema.ticketPurchases)
    .innerJoin(
      schema.events,
      eq(schema.events.id, schema.ticketPurchases.eventId),
    )
    .innerJoin(
      schema.eventTickets,
      eq(schema.eventTickets.id, schema.ticketPurchases.ticketId),
    )
    .where(eq(schema.ticketPurchases.userId, user.id))
    .orderBy(schema.ticketPurchases.purchasedAt);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">My events</h1>
        <p className="text-sm text-plum-900/60">Your tickets and aliases.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {purchases.map(({ purchase, event, ticket }) => (
          <Card key={purchase.id}>
            <CardTitle>{event.title}</CardTitle>
            <CardSubtitle>
              {formatDateRange(event.startsAt, event.endsAt)} · {ticket.label}
            </CardSubtitle>
            <Badge
              tone={
                purchase.status === "confirmed"
                  ? "mint"
                  : purchase.status === "checked_in"
                    ? "teal"
                    : "neutral"
              }
              className="mt-3"
            >
              {purchase.status.replace("_", " ")}
            </Badge>
            <div className="mt-4 flex flex-wrap gap-3">
              <AppLink
                href={`/events/me/${purchase.id}`}
                className="text-sm underline text-plum-900"
              >
                View ticket & QR →
              </AppLink>
              <AppLink
                href={`/events/${event.slug}/toolkit`}
                className="text-sm underline text-plum-900"
              >
                Event toolkit →
              </AppLink>
            </div>
          </Card>
        ))}
        {purchases.length === 0 && (
          <Card>
            <CardTitle>No tickets yet</CardTitle>
            <CardSubtitle>
              Head to the Pulse hub to find your first retreat.
            </CardSubtitle>
          </Card>
        )}
      </div>
    </div>
  );
}
