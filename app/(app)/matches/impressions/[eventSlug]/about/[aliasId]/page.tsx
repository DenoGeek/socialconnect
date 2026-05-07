import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  aliasAssignments,
  aliasPool,
  events,
  impressions,
  ticketPurchases,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDate } from "@/lib/utils/format";
import { requireSession } from "@/lib/auth/server";
import { submitImpression } from "../../../actions";

interface PageProps {
  params: Promise<{ eventSlug: string; aliasId: string }>;
}

export default async function ImpressionFormPage({ params }: PageProps) {
  const { eventSlug, aliasId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [event] = await db.select().from(events).where(eq(events.slug, eventSlug)).limit(1);
  if (!event) notFound();

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

  const [aliased] = await db
    .select({
      aliasName: aliasPool.name,
      targetUserId: aliasAssignments.userId,
    })
    .from(aliasAssignments)
    .innerJoin(aliasPool, eq(aliasPool.id, aliasAssignments.aliasId))
    .where(and(eq(aliasAssignments.eventId, event.id), eq(aliasAssignments.aliasId, aliasId)))
    .limit(1);
  if (!aliased) notFound();

  // If the user already submitted, prefill from the existing row so they can
  // see what they wrote (read-only for v1).
  const [existing] = await db
    .select()
    .from(impressions)
    .where(
      and(
        eq(impressions.eventId, event.id),
        eq(impressions.fromUserId, userId),
        eq(impressions.toUserId, aliased.targetUserId),
      ),
    )
    .limit(1);

  const action = submitImpression.bind(null, { eventSlug, aliasId });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href={`/matches/impressions/${event.slug}`}
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← {event.title}
      </Link>

      <header className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Impression about</span>
        <h1 className="text-3xl font-semibold tracking-tight">{aliased.aliasName}</h1>
        <p className="text-sm text-stone-500">
          {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{existing ? "What you wrote" : "Leave your impression"}</CardTitle>
          <CardDescription>
            Only the Concierge sees this. {existing ? "" : "Take your time."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existing ? (
            <ReadOnlyImpression existing={existing} />
          ) : (
            <form action={action} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatILiked">What stayed with you</Label>
                <Textarea
                  id="whatILiked"
                  name="whatILiked"
                  rows={3}
                  placeholder="Their warmth, a single sentence they said, the way they listened…"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dreamDate">If we connect you, what would a perfect first date look like?</Label>
                <Textarea
                  id="dreamDate"
                  name="dreamDate"
                  rows={2}
                  placeholder="A long walk, a quiet bookstore, dinner somewhere unexpected…"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Anything else for the Concierge</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Constraints, hopes, what you'd like us to know."
                />
              </div>
              <Button type="submit" size="lg">Submit impression</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ReadOnlyImpression({
  existing,
}: {
  existing: { whatILiked: string | null; dreamDate: string | null; notes: string | null };
}) {
  return (
    <dl className="flex flex-col gap-5 text-sm leading-relaxed">
      <Field label="What stayed with you">{existing.whatILiked}</Field>
      <Field label="Dream first date">{existing.dreamDate}</Field>
      <Field label="For the Concierge">{existing.notes}</Field>
    </dl>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-stone-700">
        {children || <span className="text-stone-400">—</span>}
      </dd>
    </div>
  );
}
