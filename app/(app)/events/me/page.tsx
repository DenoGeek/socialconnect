import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { aliasAssignments, aliasPool, events, ticketPurchases, ticketTiers } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils/format";
import { requireSession } from "@/lib/auth/server";

export const metadata = { title: "My tickets · Evermore" };

export default async function MyTicketsPage() {
  const session = await requireSession();

  const ownTickets = await db
    .select({
      ticket: ticketPurchases,
      event: events,
      tier: ticketTiers,
    })
    .from(ticketPurchases)
    .innerJoin(events, eq(events.id, ticketPurchases.eventId))
    .innerJoin(ticketTiers, eq(ticketTiers.id, ticketPurchases.tierId))
    .where(eq(ticketPurchases.userId, session.user.id))
    .orderBy(desc(events.startsAt));

  const eventIds = ownTickets.map((t) => t.event.id);
  const aliasRows = eventIds.length
    ? await db
        .select({
          eventId: aliasAssignments.eventId,
          name: aliasPool.name,
        })
        .from(aliasAssignments)
        .innerJoin(aliasPool, eq(aliasPool.id, aliasAssignments.aliasId))
        .where(
          and(
            inArray(aliasAssignments.eventId, eventIds),
            eq(aliasAssignments.userId, session.user.id),
          ),
        )
    : [];
  const aliasByEvent = new Map<string, string>(
    aliasRows.map((r) => [r.eventId, r.name]),
  );

  // Render QR codes server-side as data URLs to skip client JS.
  const qrByTicket = new Map<string, string>();
  for (const { ticket } of ownTickets) {
    if (ticket.status === "paid" || ticket.status === "checked_in") {
      const dataUrl = await QRCode.toDataURL(ticket.qrToken, {
        margin: 1,
        width: 320,
        color: { dark: "#1c1917", light: "#fafaf9" },
      });
      qrByTicket.set(ticket.id, dataUrl);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Tickets</span>
        <h1 className="text-3xl font-semibold tracking-tight">My tickets</h1>
      </header>

      {ownTickets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-stone-500">No tickets yet.</p>
            <Link
              href="/events"
              className="mt-3 inline-flex text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              Browse events →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-6">
          {ownTickets.map(({ ticket, event, tier }) => {
            const qr = qrByTicket.get(ticket.id);
            const alias = aliasByEvent.get(event.id);
            return (
              <li key={ticket.id}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
                        </CardDescription>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex flex-col gap-2 text-sm text-stone-700">
                      <span>{tier.name}</span>
                      {alias && (
                        <span className="text-xs text-stone-500">
                          Your alias for this event: <span className="font-medium">{alias}</span>
                        </span>
                      )}
                      {ticket.status === "pending" && (
                        <p className="text-sm text-amber-700">
                          Payment is still processing. Refresh this page after completing the M-Pesa prompt.
                        </p>
                      )}
                      {ticket.status === "cancelled" && (
                        <p className="text-sm text-stone-500">This ticket was cancelled.</p>
                      )}
                    </div>
                    {qr && (
                      <figure className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qr} alt="Ticket QR code" className="h-40 w-40" />
                        <figcaption className="text-[10px] uppercase tracking-wide text-stone-500">
                          Scan at the door
                        </figcaption>
                      </figure>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "checked_in") return <Badge variant="success">Checked in</Badge>;
  if (status === "pending") return <Badge variant="warning">Pending</Badge>;
  if (status === "refunded") return <Badge variant="muted">Refunded</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}
