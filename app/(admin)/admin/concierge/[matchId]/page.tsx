import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  impressions,
  matchHandoffs,
  matches,
  profiles,
  users,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDate } from "@/lib/utils/format";
import { declineMatch, recordHandoff } from "../actions";

interface PageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ just?: string }>;
}

export const metadata = { title: "Match · Concierge" };

export default async function ConciergeMatchPage({ params, searchParams }: PageProps) {
  const { matchId } = await params;
  const sp = await searchParams;

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  const event = match.eventId
    ? (await db.select().from(events).where(eq(events.id, match.eventId)).limit(1))[0]
    : undefined;

  const [a, b] = await Promise.all(
    [match.userAId, match.userBId].map(async (id) => {
      const [u] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          city: profiles.city,
          phone: profiles.phone,
          tier: profiles.tier,
          bio: profiles.bio,
          interests: profiles.interests,
          values: profiles.values,
          lookingFor: profiles.lookingFor,
        })
        .from(users)
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(eq(users.id, id))
        .limit(1);
      return u;
    }),
  );
  if (!a || !b) notFound();

  // Both impressions, if from event-driven match.
  const impressionRows = match.eventId
    ? await db
        .select()
        .from(impressions)
        .where(
          and(
            eq(impressions.eventId, match.eventId),
            or(
              and(eq(impressions.fromUserId, match.userAId), eq(impressions.toUserId, match.userBId)),
              and(eq(impressions.fromUserId, match.userBId), eq(impressions.toUserId, match.userAId)),
            ),
          ),
        )
    : [];
  const aboutB = impressionRows.find((i) => i.fromUserId === a.id);
  const aboutA = impressionRows.find((i) => i.fromUserId === b.id);

  const handoffs = await db
    .select()
    .from(matchHandoffs)
    .where(eq(matchHandoffs.matchId, match.id))
    .orderBy(desc(matchHandoffs.createdAt));

  const handoffAction = recordHandoff.bind(null, match.id);
  const declineAction = declineMatch.bind(null, match.id);

  const defaultMessage = buildDefaultMessage({
    a: a.name.split(" ")[0],
    b: b.name.split(" ")[0],
    eventTitle: event?.title,
  });

  return (
    <section className="flex flex-col gap-6 p-8">
      <Link
        href="/admin/concierge"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Concierge queue
      </Link>

      {sp.just === "handoff" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Introduction sent. Both parties have been notified.
        </div>
      )}

      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Match</span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {a.name} <span className="text-stone-400">×</span> {b.name}
        </h1>
        <p className="text-sm text-stone-500">
          {event ? `${event.title} · ${formatEventDate(event.startsAt, event.endsAt)}` : "Concierge-direct"}
          {" · "}
          <StatusLabel status={match.status} />
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonCard person={a} impression={aboutA} />
        <PersonCard person={b} impression={aboutB} />
      </div>

      {match.status === "pending_concierge" ? (
        <Card>
          <CardHeader>
            <CardTitle>Make the introduction</CardTitle>
            <CardDescription>
              Both will receive a branded note from the Concierge. Choose words you&apos;d be glad to read.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handoffAction} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  name="channel"
                  defaultValue="email"
                  className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone</option>
                  <option value="in_app">In-app only</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="message">Introduction</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={10}
                  defaultValue={defaultMessage}
                  required
                  minLength={20}
                />
                <p className="text-xs text-stone-500">
                  Sent to both parties verbatim, with their first name greeting.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" size="lg">Send introduction</Button>
                <form action={declineAction}>
                  <Button type="submit" variant="ghost" size="sm">
                    Decline this match
                  </Button>
                </form>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {handoffs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {handoffs.map((h) => (
                <li key={h.id} className="border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted">{h.channel}</Badge>
                    <span className="text-xs text-stone-500">
                      {new Date(h.createdAt).toLocaleString("en-KE")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{h.notes}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function PersonCard({
  person,
  impression,
}: {
  person: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    phone: string | null;
    tier: "free" | "concierge" | "elite" | null;
    bio: string | null;
    interests: string[] | null;
    values: Record<string, unknown> | null;
    lookingFor: Record<string, unknown> | null;
  };
  impression?: {
    whatILiked: string | null;
    dreamDate: string | null;
    notes: string | null;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{person.name}</CardTitle>
            <CardDescription>
              {person.email}
              {person.city ? ` · ${person.city}` : ""}
              {person.phone ? ` · ${person.phone}` : ""}
            </CardDescription>
          </div>
          {person.tier && <Badge variant="muted">{person.tier}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 text-sm">
        {person.bio && <p className="whitespace-pre-line text-stone-700">{person.bio}</p>}
        {person.interests && person.interests.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Interests</p>
            <p className="mt-1 text-stone-700">{person.interests.join(" · ")}</p>
          </div>
        )}
        {impression && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">
              Their impression of {person.name.split(" ")[0]} (the other party)
            </p>
            <ImpressionBlock impression={impression} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImpressionBlock({
  impression,
}: {
  impression: { whatILiked: string | null; dreamDate: string | null; notes: string | null };
}) {
  return (
    <dl className="mt-3 flex flex-col gap-3 text-sm">
      <Field label="What stayed with them">{impression.whatILiked}</Field>
      <Field label="Dream first date">{impression.dreamDate}</Field>
      <Field label="For the Concierge">{impression.notes}</Field>
    </dl>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-stone-700">{children}</dd>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_concierge: "Awaiting your handoff",
    introduced: "Introduced",
    declined: "Declined",
    ghosted: "Quiet",
  };
  return <span>{map[status] ?? status}</span>;
}

function buildDefaultMessage({
  a,
  b,
  eventTitle,
}: {
  a: string;
  b: string;
  eventTitle?: string;
}) {
  return `Both of you left thoughtful impressions about each other${
    eventTitle ? ` at ${eventTitle}` : ""
  }. We thought it was worth a hello.

We've copied each of you on this note rather than passing details around without your say. If you'd like to take it further, just reply to this email and we'll connect you privately.

If the timing isn't right, that's all the answer we need — no pressure, no follow-up.`;
}
