import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { MockCheckout } from "@/components/payments/mock-checkout";
import { requestSovereignPayment, requestActivationPayment } from "./actions";

export default async function ZahariPayPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  if (user.pathway !== "zahari") redirect("/apply");

  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);
  if (!eng) redirect("/apply/status");

  const sovereignPaid = Boolean(eng.sovereignPaidAt);

  const pendingPayments = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.userId, user.id));

  const sovereignPayment = pendingPayments.find(
    (p) =>
      p.subjectKind === "zahari_sovereign" &&
      p.subjectId === eng.id &&
      p.status !== "succeeded",
  );
  const activationPayment = pendingPayments.find(
    (p) =>
      p.subjectKind === "zahari_activation" &&
      p.subjectId === eng.id &&
      p.status !== "succeeded",
  );

  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Zahari fees</h1>
        <p className="text-sm text-plum-900/70">
          Secure payment for your sovereign search and covenant activation.
        </p>
        {sp.requested && (
          <p className="text-sm mt-2 text-teal font-medium">
            Payment initiated — complete checkout below.
          </p>
        )}
      </header>

      {!sovereignPaid ? (
        <Card>
          <CardTitle>
            Sovereign Search · USD{" "}
            {Number(eng.sovereignSearchFeeUsd).toLocaleString()}
          </CardTitle>
          <CardSubtitle className="mt-2">
            6-month active membership, vetting, and luxury date coordination.
          </CardSubtitle>
          {sovereignPayment ? (
            <MockCheckout
              paymentId={sovereignPayment.id}
              amount={Number(sovereignPayment.amount)}
              currency="USD"
              label="Sovereign Search"
            />
          ) : (
            <form action={requestSovereignPayment} className="mt-4">
              <button
                type="submit"
                className="rounded-full bg-plum-900 px-4 py-2 text-sm font-medium text-plum-100 hover:bg-plum-700"
              >
                Proceed to checkout
              </button>
            </form>
          )}
        </Card>
      ) : (
        <Card>
          <CardTitle>Sovereign fee recorded</CardTitle>
          <CardSubtitle className="mt-2">
            Paid {new Date(eng.sovereignPaidAt!).toLocaleDateString("en-GB")}
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
          {activationPayment ? (
            <MockCheckout
              paymentId={activationPayment.id}
              amount={Number(activationPayment.amount)}
              currency="USD"
              label="Covenant Activation"
            />
          ) : (
            <form action={requestActivationPayment} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-plum-900/20 px-4 py-2 text-sm font-medium text-plum-900 hover:bg-plum-900/5"
              >
                Proceed to checkout
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
