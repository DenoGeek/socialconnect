import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getPaymentSuccessRedirect } from "@/lib/payments";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { SimulateCheckout } from "@/components/payments/simulate-checkout";
import { formatMoney } from "@/lib/utils/format";
import { AGANO_PAYBILL } from "@/lib/payments/paybill";

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ method?: string }>;
}) {
  const user = await requireUser();
  const { paymentId } = await params;
  const sp = await searchParams;

  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);

  if (!pay || pay.userId !== user.id) notFound();

  if (pay.status === "succeeded") {
    redirect(getPaymentSuccessRedirect(pay));
  }

  const label =
    pay.subjectKind === "ticket"
      ? "Event ticket"
      : pay.subjectKind === "subscription"
        ? "Membership"
        : pay.subjectKind === "zahari_sovereign"
          ? "Zahari membership"
          : pay.subjectKind === "zahari_activation"
            ? "Zahari Covenant Activation"
            : "Payment";

  const showPaybill =
    sp.method === "paybill" ||
    pay.provider === "manual" ||
    pay.subjectKind.startsWith("zahari");

  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{label}</h1>
        <p className="text-sm text-plum-900/70 mt-1">
          {sp.method === "tinypesa"
            ? "TinyPesa prompt sent (or queued). Status updates when the webhook confirms."
            : "Complete payment via TinyPesa or Paybill. Staff can also mark Paybill payments as received."}
        </p>
      </header>

      <Card>
        <CardTitle>Amount due</CardTitle>
        <CardSubtitle className="mt-2">
          {formatMoney(Number(pay.amount), pay.currency)}
        </CardSubtitle>
        <p className="mt-2 text-xs text-plum-900/50">
          Status: {pay.status} · Provider: {pay.provider}
        </p>
      </Card>

      {showPaybill && (
        <Card>
          <CardTitle>M-Pesa Paybill</CardTitle>
          <dl className="mt-4 space-y-2 text-sm">
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
          <p className="mt-4 text-xs text-plum-900/50">
            After you pay, keep this page. Our team will mark the payment received.
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Dev simulate</CardTitle>
        <SimulateCheckout
          paymentId={pay.id}
          amount={Number(pay.amount)}
          currency={pay.currency}
          label={label}
        />
      </Card>
    </div>
  );
}
