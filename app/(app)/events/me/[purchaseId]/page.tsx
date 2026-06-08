import Image from "next/image";
import { AppLink } from "@/components/nav/app-link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils/format";
import { getAlias } from "@/lib/alias/assign";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const user = await requireUser();
  const [row] = await db
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
    .where(eq(schema.ticketPurchases.id, purchaseId))
    .limit(1);
  if (!row || row.purchase.userId !== user.id) notFound();

  const alias = await getAlias(user.id, row.event.id);

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <p className="text-xs text-plum-900/50 uppercase tracking-widest">
          Your ticket
        </p>
        <h1 className="text-display text-3xl text-plum-900">
          {row.event.title}
        </h1>
        <p className="text-sm text-plum-900/60">
          {formatDateRange(row.event.startsAt, row.event.endsAt)} · {row.ticket.label}
        </p>
      </header>

      <Card>
        <div className="flex flex-col items-center">
          <Image
            src={`/api/qr/${row.purchase.id}`}
            alt="Ticket QR"
            width={240}
            height={240}
            className="rounded-2xl"
          />
          <p className="mt-3 font-mono text-sm text-plum-900">
            {row.purchase.code}
          </p>
          <Badge tone={row.purchase.status === "confirmed" ? "mint" : "neutral"} className="mt-2">
            {row.purchase.status.replace("_", " ")}
          </Badge>
        </div>
      </Card>

      {alias && (
        <Card className="brand-card-dark border-plum-100/30">
          <CardTitle className="text-plum-100">Your Alias for this event</CardTitle>
          <p className="text-display text-3xl text-amber mt-2">
            {alias.alias.name}
          </p>
          <CardSubtitle className="text-plum-100/60 mt-2">
            Your real name is hidden until a mutual match.
          </CardSubtitle>
          <AppLink href={`/events/me/${row.purchase.id}/alias-badge`}>
            <Button variant="elite" className="mt-4">
              Export Story badge
            </Button>
          </AppLink>
        </Card>
      )}

      <Card>
        <CardTitle>Match Card</CardTitle>
        <CardSubtitle>
          After the gathering, opt in on aliases that resonated with you. Mutual
          alignments unlock your Courtship Launchpad.
        </CardSubtitle>
        {(row.purchase.status === "confirmed" ||
          row.purchase.status === "checked_in") && (
          <AppLink
            href={`/matches/impressions/${row.event.slug}`}
            className="mt-3 inline-block underline text-plum-900 text-sm font-medium"
          >
            Open Match Card →
          </AppLink>
        )}
      </Card>

      <Card>
        <CardTitle>Day-of toolkit</CardTitle>
        <CardSubtitle>
          Icebreakers, blind responses, and a private notes log unlock at the
          venue.
        </CardSubtitle>
        <AppLink
          href={`/events/${row.event.slug}/toolkit`}
          className="mt-3 inline-block underline text-plum-900 text-sm"
        >
          Open the toolkit →
        </AppLink>
      </Card>
    </div>
  );
}
