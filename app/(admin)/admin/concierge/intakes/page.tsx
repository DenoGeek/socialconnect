import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { conciergeIntakes, profiles, users } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Concierge intakes · Admin" };

const STATUSES = ["submitted", "in_review", "approved", "declined", "matched", "archived"] as const;
type Status = (typeof STATUSES)[number];

export default async function ConciergeIntakesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status: Status = STATUSES.includes(sp.status as Status)
    ? (sp.status as Status)
    : "submitted";

  const rows = await db
    .select()
    .from(conciergeIntakes)
    .where(eq(conciergeIntakes.status, status))
    .orderBy(desc(conciergeIntakes.createdAt));

  const userIds = rows.map((r) => r.userId);
  const userMap = new Map(
    (
      await (userIds.length
        ? db
            .select({
              userId: users.id,
              name: users.name,
              email: users.email,
              tier: profiles.tier,
              city: profiles.city,
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
          <h1 className="text-2xl font-semibold tracking-tight">Concierge intakes</h1>
          <p className="text-sm text-stone-500">
            Private requirements submitted by members and Elite prospects.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/concierge/intakes?status=${s}`}
              className={`rounded-full border px-3 py-1 capitalize transition-colors ${
                status === s
                  ? "border-stone-900 bg-stone-900 text-stone-50"
                  : "border-stone-300 text-stone-700 hover:border-stone-500"
              }`}
            >
              {s.replace(/_/g, " ")}
            </Link>
          ))}
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
          {rows.map((intake) => {
            const u = userMap.get(intake.userId);
            const r = (intake.requirements ?? {}) as Record<string, string | undefined>;
            return (
              <li key={intake.id}>
                <Link
                  href={`/admin/concierge/intakes/${intake.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white transition-colors hover:border-stone-400"
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{u?.name ?? "—"}</CardTitle>
                          <p className="text-xs text-stone-500">
                            {u?.email}
                            {u?.city ? ` · ${u.city}` : ""}
                            {r.ageRange ? ` · seeking ${r.ageRange}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u?.tier && <Badge variant="muted">{u.tier}</Badge>}
                          <span className="text-xs text-stone-500">
                            {new Date(intake.createdAt).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    {r.lookingFor && (
                      <CardContent>
                        <p className="line-clamp-2 text-sm text-stone-600">{r.lookingFor}</p>
                      </CardContent>
                    )}
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
