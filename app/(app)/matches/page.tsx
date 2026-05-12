import Link from "next/link";
import { eq, or, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Your matches</h1>
        <p className="text-sm text-plum-900/60">
          Only mutual opt-ins appear here.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardTitle>No matches yet</CardTitle>
          <CardSubtitle>
            After your next retreat, submit impressions to see who else opted
            in.
          </CardSubtitle>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ match }) => {
            const otherId =
              match.userAId === user.id ? match.userBId : match.userAId;
            return (
              <Card key={match.id}>
                <Badge tone="mint">{match.status.replace("_", " ")}</Badge>
                <CardTitle className="mt-2">A new connection</CardTitle>
                <CardSubtitle>
                  Compatibility {match.compatibilityScore ?? "—"}/100 ·{" "}
                  {match.sharedIntents.length} shared intent
                  {match.sharedIntents.length === 1 ? "" : "s"}
                </CardSubtitle>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <Link
                    href={`/matches/${match.id}`}
                    className="text-sm underline text-plum-900"
                  >
                    View match →
                  </Link>
                  <Link
                    href={`/matches/${match.id}/feedback`}
                    className="text-sm underline text-plum-900/70"
                  >
                    Bridge feedback →
                  </Link>
                </div>
                <p className="text-xs text-plum-900/40 mt-3">{otherId}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
