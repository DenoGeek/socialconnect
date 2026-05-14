import { desc, isNull, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const flaggedProfiles = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.flaggedForReview, true));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Safety</h1>
        <p className="text-sm text-plum-900/60">
          Open reports + auto-flagged profiles (e.g. contradictory intent
          badges).
        </p>
      </header>

      <Card>
        <CardTitle>Open reports ({reports.length})</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {reports.map(({ report, reported }) => (
            <li key={report.id} className="py-2">
              <Badge tone="amber">Report</Badge>
              <p className="text-plum-900 mt-1">{reported.name}</p>
              <p className="text-xs text-plum-900/60">{report.reason}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Auto-flagged profiles ({flaggedProfiles.length})</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {flaggedProfiles.map((p) => (
            <li key={p.id} className="py-2">
              {p.displayName ?? p.userId} ·{" "}
              <span className="text-xs text-plum-900/60">
                {(p.intentBadges ?? []).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
