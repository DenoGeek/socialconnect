import { AppLink } from "@/components/nav/app-link";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveApplication, rejectApplication, markInReview } from "./actions";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const statusFilter = sp.status ?? "submitted";

  const allStatuses = [
    "draft",
    "submitted",
    "in_review",
    "approved",
    "rejected",
  ] as const;
  type AppStatus = (typeof allStatuses)[number];
  const statuses: AppStatus[] =
    statusFilter === "all"
      ? [...allStatuses]
      : [statusFilter as AppStatus];

  const apps = await db
    .select({
      app: schema.memberApplications,
      user: schema.users,
    })
    .from(schema.memberApplications)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberApplications.userId))
    .where(inArray(schema.memberApplications.status, statuses))
    .orderBy(desc(schema.memberApplications.submittedAt));

  const concierges = await db
    .select()
    .from(schema.users)
    .where(inArray(schema.users.role, ["concierge", "admin", "super_admin"]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Applications</h1>
        <p className="text-sm text-plum-900/60">
          Vetting queue — approve Amari or Zahari pathways.
        </p>
        <div className="mt-3 flex gap-2 text-sm">
          {["submitted", "in_review", "approved", "rejected", "all"].map((s) => (
            <AppLink
              key={s}
              href={`/admin/applications?status=${s}`}
              className="underline text-plum-900 capitalize"
            >
              {s.replace("_", " ")}
            </AppLink>
          ))}
        </div>
      </header>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Applicant</th>
              <th>Pathway</th>
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {apps.map(({ app, user }) => (
              <tr key={app.id}>
                <td className="py-3">
                  <p className="text-plum-900">{user.name}</p>
                  <p className="text-xs text-plum-900/50">{user.email}</p>
                </td>
                <td>
                  <Badge tone={app.pathway === "zahari" ? "amber" : "mint"}>
                    {app.pathway}
                  </Badge>
                </td>
                <td>{app.status}</td>
                <td className="text-xs text-plum-900/50">
                  {app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString("en-GB")
                    : "—"}
                </td>
                <td>
                  {(app.status === "submitted" || app.status === "in_review") && (
                    <div className="flex flex-col gap-2 items-end">
                      {app.status === "submitted" && (
                        <form action={markInReview}>
                          <input type="hidden" name="applicationId" value={app.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Mark in review
                          </Button>
                        </form>
                      )}
                      <form action={approveApplication} className="space-y-1 text-right">
                        <input type="hidden" name="applicationId" value={app.id} />
                        {app.pathway === "zahari" && (
                          <select
                            name="matchmakerUserId"
                            className="rounded-xl border border-plum-900/15 px-2 py-1 text-xs mb-1"
                            defaultValue={concierges[0]?.id ?? ""}
                          >
                            {concierges.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectApplication}>
                        <input type="hidden" name="applicationId" value={app.id} />
                        <input
                          name="rejectionReason"
                          placeholder="Reason"
                          className="rounded-xl border px-2 py-1 text-xs mb-1 w-40"
                        />
                        <Button type="submit" variant="ghost" size="sm" className="text-red-700">
                          Reject
                        </Button>
                      </form>
                    </div>
                  )}
                  <AppLink
                    href={`/admin/users/${user.id}`}
                    className="text-xs underline block mt-1"
                  >
                    User →
                  </AppLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && (
          <p className="py-6 text-sm text-plum-900/60 text-center">
            No applications in this queue.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>Application detail (latest row)</CardTitle>
        {apps[0] && (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-plum-900/50">City</dt>
            <dd>{apps[0].app.city ?? "—"}</dd>
            <dt className="text-plum-900/50">Age</dt>
            <dd>{apps[0].app.ageAttested ?? "—"}</dd>
            <dt className="text-plum-900/50">Intent</dt>
            <dd>{apps[0].app.intentSummary ?? apps[0].app.legacyGoals ?? "—"}</dd>
          </dl>
        )}
      </Card>
    </div>
  );
}
