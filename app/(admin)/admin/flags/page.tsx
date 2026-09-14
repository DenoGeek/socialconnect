import { desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveReport, resolvePanic } from "../ops-actions";

export default async function FlagsPage() {
  await requireAdmin();

  const reports = await db
    .select({
      report: schema.userReports,
      reported: schema.users,
    })
    .from(schema.userReports)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.userReports.reportedUserId),
    )
    .where(isNull(schema.userReports.resolvedAt))
    .orderBy(desc(schema.userReports.createdAt));

  const panics = await db
    .select({
      alert: schema.panicAlerts,
      user: schema.users,
    })
    .from(schema.panicAlerts)
    .innerJoin(schema.users, eq(schema.users.id, schema.panicAlerts.userId))
    .where(isNull(schema.panicAlerts.resolvedAt))
    .orderBy(desc(schema.panicAlerts.createdAt));

  const flaggedProfiles = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.flaggedForReview, true));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Safety</h1>
        <p className="text-sm text-plum-900/60">
          Panic alerts, member reports, and flagged profiles.
        </p>
      </header>

      <Card>
        <CardTitle>Open panic alerts ({panics.length})</CardTitle>
        <ul className="mt-3 divide-y text-sm">
          {panics.map(({ alert, user }) => (
            <li key={alert.id} className="py-3 flex justify-between gap-3 items-start">
              <div>
                <Badge tone="amber">URGENT</Badge>
                <p className="mt-1 font-medium text-plum-900">{user.name}</p>
                <p className="text-xs text-plum-900/60">{user.email}</p>
                <p className="text-xs mt-1">{alert.note ?? "No note"}</p>
                <p className="text-[10px] text-plum-900/40 mt-1">
                  {new Date(alert.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <form action={resolvePanic}>
                <input type="hidden" name="alertId" value={alert.id} />
                <Button type="submit" size="sm">
                  Resolve
                </Button>
              </form>
            </li>
          ))}
          {panics.length === 0 && (
            <li className="py-2 text-plum-900/50">No open panic alerts.</li>
          )}
        </ul>
      </Card>

      <Card>
        <CardTitle>Open reports ({reports.length})</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {reports.map(({ report, reported }) => (
            <li key={report.id} className="py-2 flex justify-between gap-3">
              <div>
                <Badge tone="amber">Report</Badge>
                <p className="text-plum-900 mt-1">{reported.name}</p>
                <p className="text-xs text-plum-900/60">{report.reason}</p>
              </div>
              <form action={resolveReport}>
                <input type="hidden" name="reportId" value={report.id} />
                <Button type="submit" size="sm" variant="outline">
                  Resolve
                </Button>
              </form>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="py-2 text-plum-900/50">No open reports.</li>
          )}
        </ul>
      </Card>

      <Card>
        <CardTitle>Auto-flagged profiles ({flaggedProfiles.length})</CardTitle>
        <CardSubtitle className="mt-1">Also see Moderation queue.</CardSubtitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {flaggedProfiles.map((p) => (
            <li key={p.id} className="py-2">
              {p.displayName ?? p.userId} ·{" "}
              <span className="text-xs text-plum-900/60">
                {(p.intentBadges ?? []).join(", ")}
              </span>
            </li>
          ))}
          {flaggedProfiles.length === 0 && (
            <li className="py-2 text-plum-900/50">None flagged.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
