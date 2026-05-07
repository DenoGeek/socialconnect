import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  aliasAssignments,
  aliasPool,
  events,
  impressions,
  ticketPurchases,
} from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils/format";
import { requireSession } from "@/lib/auth/server";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function ImpressionsListPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [event] = await db.select().from(events).where(eq(events.slug, eventSlug)).limit(1);
  if (!event) notFound();

  // Confirm the user actually attended this event.
  const [own] = await db
    .select()
    .from(ticketPurchases)
    .where(
      and(
        eq(ticketPurchases.userId, userId),
        eq(ticketPurchases.eventId, event.id),
        inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
      ),
    )
    .limit(1);
  if (!own) notFound();

  // Other attendees, by their alias for this event.
  const others = await db
    .select({
      otherUserId: ticketPurchases.userId,
      aliasId: aliasAssignments.aliasId,
      aliasName: aliasPool.name,
    })
    .from(ticketPurchases)
    .innerJoin(
      aliasAssignments,
      and(
        eq(aliasAssignments.userId, ticketPurchases.userId),
        eq(aliasAssignments.eventId, event.id),
      ),
    )
    .innerJoin(aliasPool, eq(aliasPool.id, aliasAssignments.aliasId))
    .where(
      and(
        eq(ticketPurchases.eventId, event.id),
        inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
        ne(ticketPurchases.userId, userId),
      ),
    );

  // Which of these have you already left an impression about?
  const submitted = others.length
    ? await db
        .select({ toUserId: impressions.toUserId })
        .from(impressions)
        .where(
          and(
            eq(impressions.eventId, event.id),
            eq(impressions.fromUserId, userId),
            inArray(
              impressions.toUserId,
              others.map((o) => o.otherUserId),
            ),
          ),
        )
    : [];
  const submittedSet = new Set(submitted.map((r) => r.toUserId));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <Link
        href="/matches"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Matches
      </Link>

      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Impressions</span>
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        <p className="text-sm text-stone-600">
          {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>How this works</CardTitle>
          <CardDescription>
            Pick anyone you&apos;d like to know more. Your notes go to the Concierge — never to the
            other person. If they leave impressions about you, we&apos;ll connect you.
          </CardDescription>
        </CardHeader>
      </Card>

      {others.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-stone-500">
            No other attendees yet. (Aliases assign once tickets are paid.)
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((o) => {
            const done = submittedSet.has(o.otherUserId);
            return (
              <li key={o.otherUserId}>
                <Link
                  href={`/matches/impressions/${event.slug}/about/${o.aliasId}`}
                  className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-400"
                >
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400">
                      Alias
                    </span>
                    <p className="mt-2 text-xl font-medium tracking-tight group-hover:text-stone-700">
                      {o.aliasName}
                    </p>
                  </div>
                  {done ? (
                    <Badge variant="success">Submitted</Badge>
                  ) : (
                    <span className="text-xs text-stone-500">Leave impression →</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
