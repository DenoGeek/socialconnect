import { AppLink } from "@/components/nav/app-link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConciergeInbox() {
  await requireAdmin();
  const threads = await db
    .select({
      thread: schema.conciergeThreads,
      user: schema.users,
    })
    .from(schema.conciergeThreads)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.conciergeThreads.userId),
    );
  const intakes = await db
    .select()
    .from(schema.conciergeIntakes)
    .orderBy(desc(schema.conciergeIntakes.createdAt));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Concierge inbox</h1>
        <p className="text-sm text-plum-900/60">
          Elite threads + intake requests. High priority alerts on Elite.
        </p>
      </header>

      <Card>
        <CardTitle>Elite threads</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {threads.map((t) => (
            <li key={t.thread.id} className="flex justify-between py-2">
              <div>
                <p className="text-plum-900">{t.user.name}</p>
                <p className="text-xs text-plum-900/50">{t.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.user.tier === "elite" && <Badge tone="amber">High</Badge>}
                <AppLink
                  href={`/admin/concierge/${t.thread.id}`}
                  className="text-xs underline text-plum-900"
                >
                  Open →
                </AppLink>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Intake requests</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {intakes.map((i) => (
            <li key={i.id} className="py-2">
              <p className="text-plum-900">{i.fullName}</p>
              <p className="text-xs text-plum-900/50">
                {i.email} · {i.phone}
              </p>
              {i.requirements && (
                <p className="text-xs text-plum-900/70 mt-1">
                  {i.requirements}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
