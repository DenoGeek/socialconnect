import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmZahariPayment, presentCandidate } from "./actions";

export default async function AdminZahariPage() {
  await requireAdmin();

  const engagements = await db
    .select({
      eng: schema.zahariEngagements,
      user: schema.users,
    })
    .from(schema.zahariEngagements)
    .innerJoin(schema.users, eq(schema.users.id, schema.zahariEngagements.userId))
    .orderBy(desc(schema.zahariEngagements.createdAt));

  const pendingPayments = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.status, "processing"));

  const zahariPayments = pendingPayments.filter((p) =>
    p.subjectKind.startsWith("zahari"),
  );

  const candidates = await db
    .select({ user: schema.users })
    .from(schema.candidatePoolMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.candidatePoolMembers.userId))
    .where(eq(schema.candidatePoolMembers.active, true));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Zahari engagements</h1>
      </header>

      <Card>
        <CardTitle>Pending manual payments</CardTitle>
        <ul className="mt-3 divide-y text-sm">
          {zahariPayments.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>
                {p.subjectKind} · {p.currency} {Number(p.amount).toLocaleString()}
              </span>
              <form action={confirmZahariPayment}>
                <input type="hidden" name="paymentId" value={p.id} />
                <Button type="submit" size="sm">
                  Mark paid
                </Button>
              </form>
            </li>
          ))}
          {zahariPayments.length === 0 && (
            <li className="py-2 text-plum-900/50">None pending.</li>
          )}
        </ul>
      </Card>

      {engagements.map(({ eng, user }) => (
        <Card key={eng.id}>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-plum-900/60">{user.email}</p>
            </div>
            <Badge tone="amber">{eng.status}</Badge>
          </div>
          <p className="text-xs mt-2 text-plum-900/50">
            Sovereign: {eng.sovereignPaidAt ? "paid" : "due"} · Activation:{" "}
            {eng.activationPaidAt ? "paid" : "—"}
          </p>
          <form action={presentCandidate} className="mt-4 flex flex-wrap gap-2 items-end">
            <input type="hidden" name="engagementId" value={eng.id} />
            <select
              name="candidateUserId"
              className="rounded-2xl border px-3 py-2 text-sm"
              required
            >
              <option value="">Candidate from pool</option>
              {candidates.map((c) => (
                <option key={c.user.id} value={c.user.id}>
                  {c.user.name}
                </option>
              ))}
            </select>
            <input
              name="presentationSummary"
              placeholder="Presentation summary"
              className="rounded-2xl border px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <Button type="submit" size="sm">
              Present candidate
            </Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
