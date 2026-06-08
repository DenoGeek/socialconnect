import { AppLink } from "@/components/nav/app-link";
import { notFound } from "next/navigation";
import { and, eq, not, ne, or, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submitImpression } from "../actions";

export default async function ImpressionsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const user = await requireUser();
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, eventSlug))
    .limit(1);
  if (!event) notFound();

  // Window: closes N hours after event end.
  const closesAt = new Date(
    new Date(event.endsAt).getTime() +
      event.impressionDeadlineHours * 60 * 60 * 1000,
  );
  const windowOpen = new Date() < closesAt;

  // Aliases at the event (excluding mine).
  const attendees = await db
    .select({
      assignment: schema.aliasAssignments,
      alias: schema.aliasPool,
    })
    .from(schema.aliasAssignments)
    .innerJoin(
      schema.aliasPool,
      eq(schema.aliasPool.id, schema.aliasAssignments.aliasId),
    )
    .innerJoin(schema.users, eq(schema.users.id, schema.aliasAssignments.userId))
    .where(
      and(
        eq(schema.aliasAssignments.eventId, event.id),
        not(eq(schema.aliasAssignments.userId, user.id)),
        or(isNull(schema.users.pathway), ne(schema.users.pathway, "zahari")),
      ),
    );

  // What I've already opted-in on.
  const myImpressions = await db
    .select()
    .from(schema.impressions)
    .where(
      and(
        eq(schema.impressions.eventId, event.id),
        eq(schema.impressions.fromUserId, user.id),
      ),
    );

  const optedInIds = new Set(myImpressions.map((i) => i.toUserId));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Match Card · {event.title}
        </h1>
        <p className="text-sm text-plum-900/60">
          Note the alias of anyone who resonated with your spirit. Mutual
          alignments unlock your Courtship Launchpad — complimentary.
        </p>
        <p className="mt-2 text-xs text-plum-900/50">
          Window closes{" "}
          <span className="font-medium">
            {closesAt.toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          .
        </p>
      </header>

      {!windowOpen ? (
        <Card>
          <CardTitle>The impression window has closed.</CardTitle>
          <CardSubtitle>
            You&rsquo;ll see any matches in the matches page.
          </CardSubtitle>
          <AppLink
            href="/matches"
            className="mt-3 inline-block underline text-plum-900"
          >
            View my matches →
          </AppLink>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {attendees.map((a) => {
            const id = a.assignment.userId;
            const already = optedInIds.has(id);
            return (
              <Card key={a.assignment.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{a.alias.name}</CardTitle>
                    {already && <Badge tone="mint">Submitted</Badge>}
                  </div>
                </div>
                <form action={submitImpression} className="mt-3 space-y-2">
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="toUserId" value={id} />
                  <textarea
                    name="likedReason"
                    placeholder="What stood out about them? (optional)"
                    rows={2}
                    className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
                  />
                  <Button
                    type="submit"
                    variant={already ? "outline" : "primary"}
                    disabled={already}
                  >
                    {already ? "Opted in" : "Opt in"}
                  </Button>
                </form>
                <AppLink
                  href={`/matches/impressions/${event.slug}/about/${a.assignment.id}`}
                  className="mt-2 inline-block text-xs underline text-plum-900/70"
                >
                  See what they&rsquo;re about →
                </AppLink>
              </Card>
            );
          })}
          {attendees.length === 0 && (
            <Card>
              <CardTitle>No attendees yet</CardTitle>
              <CardSubtitle>
                Once others purchase tickets you&rsquo;ll see them here.
              </CardSubtitle>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
