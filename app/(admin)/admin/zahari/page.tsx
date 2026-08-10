import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZAHARI_PLANS } from "@/lib/membership/zahari-plans";
import { zahariJourneyLabel } from "@/lib/membership/zahari-status";
import {
  confirmZahariPayment,
  presentCandidate,
  bookZahariInterview,
  markInterviewPassed,
  markInterviewRejected,
  adminCancelZahari,
} from "./actions";

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
        <p className="text-sm text-plum-900/60 mt-1">
          Book interview → mark fit → member pays → present private matches.
        </p>
      </header>

      <Card>
        <CardTitle>Pending manual payments</CardTitle>
        <ul className="mt-3 divide-y text-sm">
          {zahariPayments.map((p) => (
            <li key={p.id} className="flex justify-between py-2 gap-3">
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
        <Card key={eng.id} className="space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-plum-900/60">{user.email}</p>
              <CardSubtitle className="mt-1">
                {zahariJourneyLabel(eng)}
                {eng.interviewScheduledAt
                  ? ` · ${new Date(eng.interviewScheduledAt).toLocaleString("en-GB")}`
                  : ""}
              </CardSubtitle>
            </div>
            <Badge tone="amber">{eng.status}</Badge>
          </div>

          <p className="text-xs text-plum-900/50">
            Plan: {eng.plan ?? "—"} · Fee USD {Number(eng.sovereignSearchFeeUsd).toLocaleString()} ·
            Sovereign: {eng.sovereignPaidAt ? "paid" : "due"} · Expires:{" "}
            {eng.expiresAt
              ? new Date(eng.expiresAt).toLocaleDateString("en-GB")
              : "—"}
          </p>

          {(eng.status === "pending_interview" ||
            eng.status === "interview_scheduled") && (
            <form
              action={bookZahariInterview}
              className="grid gap-2 sm:grid-cols-2 border-t border-plum-900/8 pt-4"
            >
              <input type="hidden" name="engagementId" value={eng.id} />
              <label className="text-xs text-plum-900/60">
                Interview date & time
                <input
                  type="datetime-local"
                  name="interviewScheduledAt"
                  required
                  defaultValue={
                    eng.interviewScheduledAt
                      ? new Date(eng.interviewScheduledAt).toISOString().slice(0, 16)
                      : undefined
                  }
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-plum-900/60">
                Meeting link
                <input
                  name="interviewMeetingUrl"
                  placeholder="https://…"
                  defaultValue={eng.interviewMeetingUrl ?? ""}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-plum-900/60 sm:col-span-2">
                Notes for member
                <input
                  name="interviewNotes"
                  defaultValue={eng.interviewNotes ?? ""}
                  className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
                />
              </label>
              <Button type="submit" size="sm" className="sm:col-span-2 w-fit">
                Save interview booking
              </Button>
            </form>
          )}

          {eng.status === "interview_scheduled" && (
            <div className="flex flex-wrap gap-2 border-t border-plum-900/8 pt-4">
              <form action={markInterviewPassed} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="engagementId" value={eng.id} />
                <select
                  name="recommendedPlan"
                  className="rounded-2xl border px-3 py-2 text-sm"
                  defaultValue="6_months"
                >
                  {ZAHARI_PLANS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label} · ${p.priceUsd.toLocaleString()}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm">
                  Interview passed → open payment
                </Button>
              </form>
              <form action={markInterviewRejected}>
                <input type="hidden" name="engagementId" value={eng.id} />
                <input type="hidden" name="interviewNotes" value="Not a fit after interview" />
                <Button type="submit" size="sm" variant="outline">
                  Not a fit
                </Button>
              </form>
            </div>
          )}

          {(eng.status === "active" || eng.status === "matched") && (
            <form
              action={presentCandidate}
              className="mt-2 flex flex-wrap gap-2 items-end border-t border-plum-900/8 pt-4"
            >
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
          )}

          {eng.sovereignPaidAt && eng.status !== "cancelled" && (
            <form action={adminCancelZahari} className="border-t border-plum-900/8 pt-4">
              <input type="hidden" name="engagementId" value={eng.id} />
              <input type="hidden" name="cancelReason" value="Ended by staff" />
              <Button type="submit" size="sm" variant="outline">
                End subscription (no refund)
              </Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
