import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, events, ticketPurchases, users } from "@/db/schema";
import { getSession } from "@/lib/auth/server";
import { verifyTicketToken } from "@/lib/utils/qr";

/**
 * Validate a scanned QR token and (optionally) check the holder in.
 *
 * GET  /api/qr/<token>           — verify and return ticket info
 * POST /api/qr/<token>           — mark as checked_in (admin/concierge only)
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId: token } = await ctx.params;
  return validateAndRespond(token);
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = session.user.role ?? "user";
  if (role !== "admin" && role !== "concierge") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { ticketId: token } = await ctx.params;
  let payload: ReturnType<typeof verifyTicketToken>;
  try {
    payload = verifyTicketToken(token);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 400 });
  }

  const [ticket] = await db
    .select()
    .from(ticketPurchases)
    .where(eq(ticketPurchases.id, payload.ticketId))
    .limit(1);
  if (!ticket) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  if (ticket.status !== "paid" && ticket.status !== "checked_in") {
    return NextResponse.json({ ok: false, reason: `ticket_${ticket.status}` }, { status: 409 });
  }

  if (ticket.status === "checked_in") {
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      checkedInAt: ticket.checkedInAt,
    });
  }

  await db
    .update(ticketPurchases)
    .set({ status: "checked_in", checkedInAt: new Date(), updatedAt: new Date() })
    .where(eq(ticketPurchases.id, ticket.id));

  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: "ticket.check_in",
    resourceType: "ticket_purchase",
    resourceId: ticket.id,
  });

  return NextResponse.json({ ok: true, alreadyCheckedIn: false });
}

async function validateAndRespond(token: string) {
  let payload: ReturnType<typeof verifyTicketToken>;
  try {
    payload = verifyTicketToken(token);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 400 });
  }

  const [row] = await db
    .select({
      ticket: ticketPurchases,
      event: events,
      user: users,
    })
    .from(ticketPurchases)
    .innerJoin(events, eq(events.id, ticketPurchases.eventId))
    .innerJoin(users, eq(users.id, ticketPurchases.userId))
    .where(eq(ticketPurchases.id, payload.ticketId))
    .limit(1);

  if (!row) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    ticket: {
      id: row.ticket.id,
      status: row.ticket.status,
      eventTitle: row.event.title,
      attendeeName: row.user.name,
      checkedInAt: row.ticket.checkedInAt,
    },
  });
}
