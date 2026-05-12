import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { BuyForm } from "./buy-form";

export default async function BuyTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ticketId?: string }>;
}) {
  const { slug } = await params;
  const { ticketId } = await searchParams;
  const user = await requireUser();
  if (!ticketId) notFound();

  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, slug))
    .limit(1);
  if (!event) notFound();

  const [ticket] = await db
    .select()
    .from(schema.eventTickets)
    .where(
      and(
        eq(schema.eventTickets.id, ticketId),
        eq(schema.eventTickets.eventId, event.id),
      ),
    )
    .limit(1);
  if (!ticket) notFound();

  return <BuyForm event={event} ticket={ticket} userId={user.id} />;
}
