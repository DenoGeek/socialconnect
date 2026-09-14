/* eslint-disable react-hooks/purity */
import { AppLink } from "@/components/nav/app-link";
import { and, count, eq, gte, sql, desc, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CommandDashboard() {
  await requireAdmin();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ value: totalUsers }] = await db
    .select({ value: count() })
    .from(schema.users);
  const [{ value: tickets24h }] = await db
    .select({ value: count() })
    .from(schema.ticketPurchases)
    .where(gte(schema.ticketPurchases.purchasedAt, dayAgo));
  const [{ value: revenueRow }] = await db
    .select({
      value: sql<string>`COALESCE(SUM(${schema.payments.amount}), 0)`,
    })
    .from(schema.payments)
    .where(eq(schema.payments.status, "succeeded"));
  const flagged = await db
    .select({ value: count() })
    .from(schema.userReports)
    .where(sql`${schema.userReports.resolvedAt} IS NULL`);

  const [{ value: menCount }] = await db
    .select({ value: count() })
    .from(schema.profiles)
    .where(eq(schema.profiles.gender, "man"));
  const [{ value: womenCount }] = await db
    .select({ value: count() })
    .from(schema.profiles)
    .where(eq(schema.profiles.gender, "woman"));
  const [{ value: matchCount }] = await db
    .select({ value: count() })
    .from(schema.matches);
  const [{ value: approvedMembers }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.vettingStatus, "approved"));
  const [{ value: active7d }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(
      and(
        isNotNull(schema.users.lastSeenAt),
        gte(schema.users.lastSeenAt, weekAgo),
      ),
    );
  const [{ value: paymentsPending }] = await db
    .select({ value: count() })
    .from(schema.payments)
    .where(
      sql`${schema.payments.status} IN ('pending', 'processing')`,
    );

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const [{ value: dau }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(
      and(
        isNotNull(schema.users.lastSeenAt),
        gte(schema.users.lastSeenAt, dayStart),
      ),
    );

  const [{ value: impressionsCount }] = await db
    .select({ value: count() })
    .from(schema.impressions);
  const [{ value: mutualCount }] = await db
    .select({ value: count() })
    .from(schema.matches)
    .where(eq(schema.matches.status, "mutual"));
  const meaningfulRate =
    Number(impressionsCount) === 0
      ? "—"
      : `${Math.round((Number(mutualCount) / Number(impressionsCount)) * 1000) / 10}%`;

  const [{ value: ticketHolders }] = await db
    .select({ value: count() })
    .from(schema.ticketPurchases)
    .where(
      sql`${schema.ticketPurchases.status} IN ('confirmed', 'checked_in')`,
    );
  const [{ value: attendeesWithImpression }] = await db
    .select({
      value: sql<number>`COUNT(DISTINCT ${schema.impressions.fromUserId})`,
    })
    .from(schema.impressions);
  const eventToCommunity =
    Number(ticketHolders) === 0
      ? "—"
      : `${Math.round((Number(attendeesWithImpression) / Number(ticketHolders)) * 1000) / 10}%`;

  const [{ value: npsAvg }] = await db
    .select({
      value: sql<string>`COALESCE(AVG(${schema.eventNpsResponses.score}), 0)`,
    })
    .from(schema.eventNpsResponses);

  const [{ value: ticketRevenue }] = await db
    .select({
      value: sql<string>`COALESCE(SUM(${schema.payments.amount}), 0)`,
    })
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.status, "succeeded"),
        eq(schema.payments.subjectKind, "ticket"),
      ),
    );

  const [{ value: rsvpCount }] = await db
    .select({ value: count() })
    .from(schema.ticketPurchases);

  const [{ value: zahariCancels }] = await db
    .select({ value: count() })
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.status, "cancelled"));

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
    .leftJoin(schema.users, eq(schema.users.id, schema.payments.userId))
    .orderBy(desc(schema.payments.createdAt))
    .limit(8);

  const genderTotal = Number(menCount) + Number(womenCount);
  const genderRatio =
    genderTotal === 0
      ? "—"
      : `${Math.round((Number(menCount) / genderTotal) * 100)}% M · ${Math.round((Number(womenCount) / genderTotal) * 100)}% F`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Command</h1>
        <p className="text-sm text-plum-900/60">Live ecosystem status.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total souls" value={Number(totalUsers).toLocaleString()} />
        <KPI
          label="Approved members"
          value={Number(approvedMembers).toLocaleString()}
        />
        <KPI label="Active · 7d" value={Number(active7d).toLocaleString()} />
        <KPI label="DAU (today)" value={Number(dau).toLocaleString()} />
        <KPI label="Gender mix" value={genderRatio} />
        <KPI label="Mutual matches" value={Number(matchCount).toLocaleString()} />
        <KPI label="Meaningful connection rate" value={meaningfulRate} />
        <KPI label="Event → community" value={eventToCommunity} />
        <KPI
          label="Post-event NPS avg"
          value={Number(npsAvg).toFixed(1)}
        />
        <KPI label="Tickets · 24h" value={Number(tickets24h).toLocaleString()} />
        <KPI
          label="Ticket revenue"
          value={`${Number(ticketRevenue).toLocaleString()}`}
        />
        <KPI label="RSVPs / tickets" value={Number(rsvpCount).toLocaleString()} />
        <KPI
          label="Revenue (all-time)"
          value={`KSh ${Number(revenueRow).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`}
        />
        <KPI
          label="Payments awaiting"
          value={Number(paymentsPending).toLocaleString()}
        />
        <KPI
          label="Zahari cancels / churn"
          value={Number(zahariCancels).toLocaleString()}
        />
        <KPI
          label="Open red flags"
          value={Number(flagged[0]?.value ?? 0).toLocaleString()}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Recent payments</CardTitle>
            <AppLink
              href="/admin/payments"
              className="text-xs underline text-plum-900"
            >
              Open feed →
            </AppLink>
          </div>
          <ul className="mt-3 divide-y divide-plum-900/8">
            {recentPayments.map(({ payment, user }) => (
              <li
                key={payment.id}
                className="flex justify-between py-2 text-sm"
              >
                <div>
                  <p className="text-plum-900">{payment.senderDisplayName}</p>
                  <p className="text-xs text-plum-900/50">
                    {user?.email ?? "—"} · {payment.subjectKind} ·{" "}
                    {payment.provider}
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
