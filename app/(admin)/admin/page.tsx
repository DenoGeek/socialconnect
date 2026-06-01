/* eslint-disable react-hooks/purity */
import { AppLink } from "@/components/nav/app-link";
import { count, eq, gte, sql, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CommandDashboard() {
  await requireAdmin();

  const [{ value: totalUsers }] = await db
    .select({ value: count() })
    .from(schema.users);
  const [{ value: tickets24h }] = await db
    .select({ value: count() })
    .from(schema.ticketPurchases)
    .where(
      gte(
        schema.ticketPurchases.purchasedAt,
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      ),
    );
  const [{ value: revenueRow }] = await db
    .select({
      value: sql<string>`COALESCE(SUM(${schema.payments.amount}), 0)`,
    })
    .from(schema.payments)
    .where(eq(schema.payments.status, "succeeded"));
  const flagged = await db
    .select({ value: count() })
    .from(schema.userReports);
  const upcoming = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.status, "published"))
    .orderBy(schema.events.startsAt)
    .limit(5);
  const recentPayments = await db
    .select({
      payment: schema.payments,
      user: schema.users,
    })
    .from(schema.payments)
    .leftJoin(
      schema.users,
      eq(schema.users.id, schema.payments.userId),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(8);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Command</h1>
        <p className="text-sm text-plum-900/60">Live ecosystem status.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total souls" value={Number(totalUsers).toLocaleString()} />
        <KPI label="Tickets · 24h" value={Number(tickets24h).toLocaleString()} />
        <KPI
          label="Revenue (all-time)"
          value={`KSh ${Number(revenueRow).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`}
        />
        <KPI label="Open red flags" value={Number(flagged[0]?.value ?? 0).toLocaleString()} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Recent payments</CardTitle>
          <ul className="mt-3 divide-y divide-plum-900/8">
            {recentPayments.map(({ payment, user }) => (
              <li
                key={payment.id}
                className="flex justify-between py-2 text-sm"
              >
                <div>
                  <p className="text-plum-900">{payment.senderDisplayName}</p>
                  <p className="text-xs text-plum-900/50">
                    {user?.email ?? "—"} · {payment.subjectKind}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-plum-900">
                    {payment.currency} {Number(payment.amount).toLocaleString()}
                  </p>
                  <Badge
                    tone={
                      payment.status === "succeeded"
                        ? "mint"
                        : payment.status === "failed"
                          ? "neutral"
                          : "amber"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Upcoming events</CardTitle>
          <ul className="mt-3 divide-y divide-plum-900/8">
            {upcoming.map((e) => (
              <li key={e.id} className="flex justify-between py-2 text-sm">
                <div>
                  <p className="text-plum-900">{e.title}</p>
                  <p className="text-xs text-plum-900/50">
                    {new Date(e.startsAt).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {e.city ?? "—"}
                  </p>
                </div>
                <AppLink
                  href={`/admin/events/${e.id}/scan`}
                  className="text-xs underline text-plum-900"
                >
                  Check-in →
                </AppLink>
              </li>
            ))}
            {upcoming.length === 0 && (
              <CardSubtitle>No events scheduled.</CardSubtitle>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs uppercase tracking-widest text-plum-900/50">
        {label}
      </p>
      <p className="text-display text-3xl text-plum-900 mt-1">{value}</p>
    </Card>
  );
}
