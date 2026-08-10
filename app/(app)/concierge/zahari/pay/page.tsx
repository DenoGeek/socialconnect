import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGANO_PAYBILL } from "@/lib/payments/paybill";
import { ZAHARI_PLANS } from "@/lib/membership/zahari-plans";
import {
  canZahariPay,
  zahariJourneyLabel,
} from "@/lib/membership/zahari-status";
import { AppLink } from "@/components/nav/app-link";
import {
  selectZahariPlan,
  startPaybillPayment,
  startTinypesaPayment,
  simulateSovereignPayment,
  simulateActivationPayment,
} from "./actions";

export default async function ZahariPayPage() {
  const user = await requireUser();
  if (user.pathway !== "zahari") redirect("/apply");

  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) redirect("/apply/status");

  const sovereignPaid = Boolean(eng.sovereignPaidAt);
  const payable = canZahariPay(eng);

  if (
    eng.status === "pending_interview" ||
    eng.status === "interview_scheduled" ||
    eng.status === "interview_rejected"
  ) {
    return (
      <div className="max-w-md space-y-4">
        <header>
          <h1 className="text-display text-3xl text-plum-900">Zahari journey</h1>
          <Badge tone="amber" className="mt-2">
            {zahariJourneyLabel(eng)}
          </Badge>
        </header>
        <Card>
          <CardTitle>
            {eng.status === "interview_rejected"
              ? "We were not the right fit"
              : "Interview comes first"}
          </CardTitle>
          <CardSubtitle className="mt-2">
            {eng.status === "pending_interview" &&
              "Our team will book a private 20-minute video chat. Payment opens only after we confirm you are a match for Zahari."}
            {eng.status === "interview_scheduled" &&
              `Your interview is booked for ${new Date(
                eng.interviewScheduledAt!,
              ).toLocaleString("en-GB")}.${
                eng.interviewMeetingUrl
                  ? ` Join: ${eng.interviewMeetingUrl}`
                  : ""
              }`}
            {eng.status === "interview_rejected" &&
              "You can switch to Amari from Account with no consequences, since payment was never taken."}
          </CardSubtitle>
          {eng.status === "interview_rejected" && (
            <AppLink href="/account" className="block mt-4">
              <Button className="w-full">
                Open Account, Billing & Membership
              </Button>
            </AppLink>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Zahari membership</h1>
        <p className="text-sm text-plum-900/70">
          Private matching, date packages, date concierge, and the elite couples pool.
        </p>
      </header>

      {payable && !eng.plan && (
        <Card>
          <CardTitle>Choose your plan</CardTitle>
          <CardSubtitle className="mt-2">
            Pricing is in USD. Pay via TinyPesa or M-Pesa Paybill until USD card checkout is available.
          </CardSubtitle>
          <div className="mt-4 space-y-3">
            {ZAHARI_PLANS.map((plan) => (
              <form key={plan.slug} action={selectZahariPlan}>
                <input type="hidden" name="plan" value={plan.slug} />
                <Button type="submit" variant="outline" className="w-full justify-between">
                  <span>{plan.label}</span>
                  <span>USD {plan.priceUsd.toLocaleString()}</span>
                </Button>
              </form>
            ))}
          </div>
        </Card>
      )}

      {payable && eng.plan && !sovereignPaid && (
        <>
          <Card>
            <Badge tone="amber">{eng.plan === "1_year" ? "1 year" : "6 months"}</Badge>
            <CardTitle className="mt-2">
              USD {Number(eng.sovereignSearchFeeUsd).toLocaleString()}
            </CardTitle>
            <CardSubtitle className="mt-2">
              Includes private matching, date packages, date concierge, and elite couples pool access.
            </CardSubtitle>
          </Card>

          <Card>
            <CardTitle>Pay with TinyPesa</CardTitle>
            <CardSubtitle className="mt-2">
              Enter the M-Pesa number that should receive the STK prompt.
            </CardSubtitle>
            <form action={startTinypesaPayment} className="mt-4 space-y-3">
              <input
                name="phone"
                placeholder="2547…"
                required
                className="w-full rounded-2xl border px-3 py-2 text-sm"
              />
              <Button type="submit" className="w-full">
                Send TinyPesa prompt
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Pay via M-Pesa Paybill</CardTitle>
            <CardSubtitle className="mt-2">
              Use these details, then staff will confirm your payment.
            </CardSubtitle>
            <dl className="mt-4 space-y-2 text-sm text-plum-900">
              <div className="flex justify-between gap-4">
                <dt className="text-plum-900/50">Paybill</dt>
                <dd className="font-medium">{AGANO_PAYBILL.paybill}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-plum-900/50">Account number</dt>
                <dd className="font-medium">{AGANO_PAYBILL.accountNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-plum-900/50">Name</dt>
                <dd className="font-medium">{AGANO_PAYBILL.accountName}</dd>
              </div>
            </dl>
            <form action={startPaybillPayment} className="mt-4">
              <Button type="submit" variant="outline" className="w-full">
                I have paid / view payment record
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Dev simulate</CardTitle>
            <form action={simulateSovereignPayment} className="mt-4">
              <Button type="submit" variant="outline" className="w-full">
                Simulate payment success
              </Button>
            </form>
          </Card>
        </>
      )}

      {sovereignPaid && (
        <Card>
          <CardTitle>Membership recorded</CardTitle>
          <CardSubtitle className="mt-2">
            Paid {new Date(eng.sovereignPaidAt!).toLocaleDateString("en-GB")}
            {eng.expiresAt
              ? ` · Renews / expires ${new Date(eng.expiresAt).toLocaleDateString("en-GB")}`
              : ""}
          </CardSubtitle>
        </Card>
      )}

      {sovereignPaid && !eng.activationPaidAt && (
        <Card>
          <CardTitle>
            Covenant Activation · USD{" "}
            {Number(eng.covenantActivationFeeUsd).toLocaleString()}
          </CardTitle>
          <CardSubtitle className="mt-2">
            Due when you and your match enter courtship.
          </CardSubtitle>
          <form action={simulateActivationPayment} className="mt-4">
            <Button type="submit" variant="outline" className="w-full">
              Simulate payment
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
