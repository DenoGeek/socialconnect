import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, matches, ticketPurchases, users } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin · Evermore" };

export default async function AdminHome() {
  const [{ value: usersCount }] = await db.select({ value: count() }).from(users);
  const [{ value: paidTickets }] = await db
    .select({ value: count() })
    .from(ticketPurchases)
    .where(eq(ticketPurchases.status, "paid"));
  const [{ value: activeEvents }] = await db
    .select({ value: count() })
    .from(events)
    .where(eq(events.status, "published"));
  const [{ value: pendingMatches }] = await db
    .select({ value: count() })
    .from(matches)
    .where(eq(matches.status, "pending_concierge"));

  const stats: Array<{ label: string; value: number }> = [
    { label: "Total members", value: usersCount },
    { label: "Active events", value: activeEvents },
    { label: "Paid tickets", value: paidTickets },
    { label: "Matches awaiting handoff", value: pendingMatches },
  ];

  return (
    <section className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-stone-500">A quick read of the room.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-3xl font-semibold">{s.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-stone-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
