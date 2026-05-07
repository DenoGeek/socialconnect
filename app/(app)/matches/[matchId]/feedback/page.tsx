import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  aliasAssignments,
  aliasPool,
  dateFeedback,
  events,
  matches,
} from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth/server";
import { submitFeedback } from "./actions";

interface PageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export const metadata = { title: "Post-date feedback · Evermore" };

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { matchId } = await params;
  const sp = await searchParams;
  const session = await requireSession();
  const userId = session.user.id;

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        or(eq(matches.userAId, userId), eq(matches.userBId, userId)),
      ),
    )
    .limit(1);
  if (!match) notFound();

  const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
  let otherAlias: string | null = null;
  if (match.eventId) {
    const [row] = await db
      .select({ name: aliasPool.name })
      .from(aliasAssignments)
      .innerJoin(aliasPool, eq(aliasPool.id, aliasAssignments.aliasId))
      .where(
        and(
          eq(aliasAssignments.eventId, match.eventId),
          eq(aliasAssignments.userId, otherUserId),
        ),
      )
      .limit(1);
    otherAlias = row?.name ?? null;
  }

  const event = match.eventId
    ? (await db.select().from(events).where(eq(events.id, match.eventId)).limit(1))[0]
    : undefined;

  const own = await db
    .select()
    .from(dateFeedback)
    .where(and(eq(dateFeedback.matchId, match.id), eq(dateFeedback.fromUserId, userId)))
    .orderBy(desc(dateFeedback.createdAt));

  const action = submitFeedback.bind(null, match.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href="/matches"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Matches
      </Link>

      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Private feedback</span>
        <h1 className="text-3xl font-semibold tracking-tight">{otherAlias ?? "About the match"}</h1>
        {event && <p className="text-sm text-stone-500">{event.title}</p>}
      </header>

      {sp.saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Thank you. The Concierge will use your note to refine future suggestions.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How did it go?</CardTitle>
          <CardDescription>
            Only the Concierge sees this. The other person never does.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rating">Honest rating</Label>
              <select
                id="rating"
                name="rating"
                defaultValue=""
                required
                className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
              >
                <option value="" disabled>
                  Pick one…
                </option>
                <option value="great">Great chemistry — please do more like this</option>
                <option value="ok">Pleasant; not sure either way</option>
                <option value="no_chemistry">No chemistry</option>
                <option value="not_my_pace">Not my pace right now</option>
                <option value="other">Other (note below)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Anything to refine future matches</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={5}
                placeholder="What we got right, what we missed, what you'd love next."
              />
            </div>
            <Button type="submit" size="lg">Send to Concierge</Button>
          </form>
        </CardContent>
      </Card>

      {own.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your previous notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {own.map((f) => (
                <li key={f.id} className="border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs text-stone-500">
                    {new Date(f.createdAt).toLocaleString("en-KE")}
                    {f.rating ? ` · ${f.rating.replace(/_/g, " ")}` : ""}
                  </p>
                  {f.notes && (
                    <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{f.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
