import Link from "next/link";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  matches,
  profiles,
  users,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils/format";

export const metadata = { title: "Concierge queue · Admin" };

export default async function ConciergeQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as "pending_concierge" | "introduced" | "declined" | "ghosted") ?? "pending_concierge";

  const rows = await db
    .select({
      match: matches,
      event: events,
    })
    .from(matches)
    .leftJoin(events, eq(events.id, matches.eventId))
    .where(eq(matches.status, status))
    .orderBy(desc(matches.createdAt));

  const userIds = Array.from(new Set(rows.flatMap((r) => [r.match.userAId, r.match.userBId])));
  const userMap = new Map(
    (
      await (userIds.length
        ? db
            .select({
              userId: users.id,
              name: users.name,
              email: users.email,
              city: profiles.city,
              tier: profiles.tier,
            })
            .from(users)
            .leftJoin(profiles, eq(profiles.userId, users.id))
            .where(inArray(users.id, userIds))
        : Promise.resolve([]))
    ).map((u) => [u.userId, u]),
  );

  return (
    <section className="flex flex-col gap-6 p-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Concierge queue</h1>
          <p className="text-sm text-stone-500">
            Mutual matches awaiting a thoughtful introduction.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          <FilterLink current={status} value="pending_concierge" label="Pending" />
          <FilterLink current={status} value="introduced" label="Introduced" />
          <FilterLink current={status} value="declined" label="Declined" />
          <FilterLink current={status} value="ghosted" label="Quiet" />
        </nav>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-stone-500">
            Nothing in this state.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ match, event }) => {
            const a = userMap.get(match.userAId);
            const b = userMap.get(match.userBId);
            return (
              <li key={match.id}>
                <Link
                  href={`/admin/concierge/${match.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white transition-colors hover:border-stone-400"
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {a?.name ?? "—"} <span className="text-stone-400">×</span>{" "}
                            {b?.name ?? "—"}
                          </CardTitle>
                          <p className="text-xs text-stone-500">
                            {event ? `${event.title} · ${formatEventDate(event.startsAt, event.endsAt)}` : "Concierge-direct"}
                          </p>
                        </div>
                        <Badge variant="muted">
                          {new Date(match.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-6 text-xs text-stone-500">
                      <span>{a?.email}</span>
                      <span>{b?.email}</span>
                      <span className="ml-auto text-stone-400">View →</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FilterLink({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`/admin/concierge?status=${value}`}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active
          ? "border-stone-900 bg-stone-900 text-stone-50"
          : "border-stone-300 text-stone-700 hover:border-stone-500"
      }`}
    >
      {label}
    </Link>
  );
}
