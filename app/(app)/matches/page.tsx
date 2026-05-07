import Link from "next/link";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aliasAssignments,
  aliasPool,
  events,
  impressions,
  matches,
  ticketPurchases,
} from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils/format";
import { requireSession } from "@/lib/auth/server";

export const metadata = { title: "Matches · Evermore" };

export default async function MatchesPage() {
  const session = await requireSession();
  const userId = session.user.id;

  // Events the user attended that are completed → impressions are open.
  const attendedCompleted = await db
    .select({
      event: events,
    })
    .from(ticketPurchases)
    .innerJoin(events, eq(events.id, ticketPurchases.eventId))
    .where(
      and(
        eq(ticketPurchases.userId, userId),
        inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
        eq(events.status, "completed"),
      ),
    )
    .orderBy(desc(events.startsAt));

  // For each completed event, has the user already submitted at least one impression?
  const submittedCounts = attendedCompleted.length
    ? await db
        .select({
          eventId: impressions.eventId,
          count: sql<number>`count(*)`,
        })
        .from(impressions)
        .where(
          and(
            eq(impressions.fromUserId, userId),
            inArray(
              impressions.eventId,
              attendedCompleted.map((r) => r.event.id),
            ),
          ),
        )
        .groupBy(impressions.eventId)
    : [];
  const submittedByEvent = new Map(
    submittedCounts.map((r) => [r.eventId, Number(r.count)]),
  );

  // Mutual matches involving this user.
  const userMatches = await db
    .select()
    .from(matches)
    .where(or(eq(matches.userAId, userId), eq(matches.userBId, userId)))
    .orderBy(desc(matches.createdAt));

  // For each match, look up the other user's per-event Alias.
  const otherUserIds = userMatches.map((m) => (m.userAId === userId ? m.userBId : m.userAId));
  const otherEventPairs = userMatches
    .filter((m) => !!m.eventId)
    .map((m) => ({
      eventId: m.eventId!,
      otherUserId: m.userAId === userId ? m.userBId : m.userAId,
    }));

  const aliasRows =
    otherEventPairs.length === 0
      ? []
      : await db
          .select({
            eventId: aliasAssignments.eventId,
            userId: aliasAssignments.userId,
            name: aliasPool.name,
          })
          .from(aliasAssignments)
          .innerJoin(aliasPool, eq(aliasPool.id, aliasAssignments.aliasId))
          .where(
            and(
              inArray(
                aliasAssignments.eventId,
                otherEventPairs.map((p) => p.eventId),
              ),
              inArray(aliasAssignments.userId, otherUserIds),
            ),
          );

  const aliasFor = (eventId: string | null, otherUserId: string) => {
    if (!eventId) return null;
    return aliasRows.find((r) => r.eventId === eventId && r.userId === otherUserId)?.name ?? null;
  };

  const eventMap = new Map(
    (
      await (userMatches.length
        ? db
            .select()
            .from(events)
            .where(
              inArray(
                events.id,
                userMatches.map((m) => m.eventId).filter((x): x is string => !!x),
              ),
            )
        : Promise.resolve([]))
    ).map((e) => [e.id, e]),
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Matches</span>
        <h1 className="text-3xl font-semibold tracking-tight">Your match loop</h1>
        <p className="text-sm text-stone-600">
          Quietly leave impressions after each event. We only tell you when someone leaves
          impressions about you in return.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Open impressions</h2>
        {attendedCompleted.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              Nothing to fill in yet — impressions open after each event ends.
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {attendedCompleted.map(({ event }) => {
              const submitted = submittedByEvent.get(event.id) ?? 0;
              return (
                <li key={event.id}>
                  <Link
                    href={`/matches/impressions/${event.slug}`}
                    className="block rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-400"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-stone-500">
                          {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
                        </p>
                      </div>
                      <span className="text-xs text-stone-500">
                        {submitted > 0 ? `${submitted} submitted` : "Start"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Mutual matches</h2>
        {userMatches.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-stone-500">
              None yet. We&apos;ll let you know when someone you mentioned mentions you back.
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {userMatches.map((match) => {
              const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
              const alias = aliasFor(match.eventId, otherUserId);
              const event = match.eventId ? eventMap.get(match.eventId) : undefined;
              return (
                <li key={match.id}>
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{alias ?? "A match"}</CardTitle>
                          <CardDescription>
                            {event ? event.title : "Concierge introduction"}
                          </CardDescription>
                        </div>
                        <MatchStatusBadge status={match.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-stone-600">
                      {match.status === "pending_concierge" && (
                        <p>The Concierge will reach out within 48 hours with a thoughtful intro.</p>
                      )}
                      {match.status === "introduced" && (
                        <p>Introductions sent. Once you&apos;ve had a date,{" "}
                          <Link
                            href={`/matches/${match.id}/feedback`}
                            className="font-medium text-stone-900 underline-offset-4 hover:underline"
                          >
                            leave a private note
                          </Link>{" "}
                          for our records.
                        </p>
                      )}
                      {match.status === "declined" && (
                        <p className="text-stone-500">Connection didn&apos;t move forward.</p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function MatchStatusBadge({ status }: { status: string }) {
  if (status === "introduced") return <Badge variant="success">Introduced</Badge>;
  if (status === "pending_concierge") return <Badge variant="warning">With concierge</Badge>;
  if (status === "declined") return <Badge variant="muted">Declined</Badge>;
  if (status === "ghosted") return <Badge variant="muted">Quiet</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}
