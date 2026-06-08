import { AppLink } from "@/components/nav/app-link";
import { eq, or, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOpenMatchCardEvents } from "@/lib/matching/open-match-cards";

export default async function MatchesPage() {
  const user = await requireUser();
  const rows = await db
    .select({
      match: schema.matches,
    })
    .from(schema.matches)
    .where(
      or(
        eq(schema.matches.userAId, user.id),
        eq(schema.matches.userBId, user.id),
      ),
    )
    .orderBy(desc(schema.matches.matchedAt));

  const otherIds = rows.map(({ match }) =>
    match.userAId === user.id ? match.userBId : match.userAId,
  );
  const profiles =
    otherIds.length > 0
      ? await db
          .select()
          .from(schema.profiles)
          .where(inArray(schema.profiles.userId, otherIds))
      : [];
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

  const openMatchCards = await getOpenMatchCardEvents(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Your matches</h1>
        <p className="text-sm text-plum-900/60">
          Only mutual opt-ins appear here.
        </p>
      </header>

      {openMatchCards.length > 0 && (
        <Card className="bg-mint-soft border border-mint">
          <CardTitle>Open Match Cards</CardTitle>
          <CardSubtitle>
            Submit impressions while the window is still open after your event.
          </CardSubtitle>
          <ul className="mt-4 space-y-2">
            {openMatchCards.map(({ event, closesAt, impressionCount }) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-plum-900 font-medium">{event.title}</span>
                <span className="text-plum-900/50 text-xs">
                  Closes{" "}
                  {closesAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {impressionCount > 0
                    ? ` · ${impressionCount} submitted`
                    : ""}
                </span>
                <AppLink
                  href={`/matches/impressions/${event.slug}`}
                  className="underline text-plum-900"
                >
                  Open Match Card →
                </AppLink>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardTitle>No matches yet</CardTitle>
          <CardSubtitle>
            After your next retreat, submit impressions on the Match Card to see
            who else opted in.
          </CardSubtitle>
          {openMatchCards.length === 0 && (
            <AppLink href="/events" className="mt-3 inline-block underline text-plum-900">
              Browse Pulse Hub →
            </AppLink>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ match }) => {
            const otherId =
              match.userAId === user.id ? match.userBId : match.userAId;
            const otherProfile = profileByUserId.get(otherId);
            return (
              <Card key={match.id}>
                <Badge tone="mint">{match.status.replace("_", " ")}</Badge>
                <CardTitle className="mt-2">
                  {otherProfile?.displayName ?? "A new connection"}
                </CardTitle>
                <CardSubtitle>
                  Compatibility {match.compatibilityScore ?? "—"}/100 ·{" "}
                  {match.sharedIntents.length} shared intent
                  {match.sharedIntents.length === 1 ? "" : "s"}
                </CardSubtitle>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <AppLink
                    href={`/matches/${match.id}`}
                    className="text-sm underline text-plum-900"
                  >
                    View match →
                  </AppLink>
                  <AppLink
                    href={`/matches/${match.id}/feedback`}
                    className="text-sm underline text-plum-900/70"
                  >
                    Bridge feedback →
                  </AppLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
