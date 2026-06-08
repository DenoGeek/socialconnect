import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MockCheckout } from "@/components/payments/mock-checkout";
import { formatMoney } from "@/lib/utils/format";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const user = await requireUser();
  const { paymentId } = await params;

  const [pay] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);

  if (!pay || pay.userId !== user.id) notFound();

  if (pay.status === "succeeded") {
    if (pay.subjectKind === "ticket") {
      redirect(`/events/me/${pay.subjectId}`);
    }
    if (
      pay.subjectKind === "zahari_sovereign" ||
      pay.subjectKind === "zahari_activation"
    ) {
      redirect("/concierge/zahari/pay");
    }
    redirect("/profile");
  }

  const label =
    pay.subjectKind === "ticket"
      ? "Event ticket"
      : pay.subjectKind === "subscription"
        ? "Membership"
        : pay.subjectKind === "zahari_sovereign"
          ? "Zahari Sovereign Search"
          : pay.subjectKind === "zahari_activation"
            ? "Zahari Covenant Activation"
            : "Payment";

  const successRedirect =
    pay.subjectKind === "ticket"
      ? `/events/me/${pay.subjectId}`
      : pay.subjectKind === "zahari_sovereign" ||
          pay.subjectKind === "zahari_activation"
        ? "/concierge/zahari/pay"
        : "/profile";

  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Checkout</h1>
        <Badge tone="amber" className="mt-2">
          {pay.status}
        </Badge>
      </header>
      <Card>
        <CardTitle>{label}</CardTitle>
        <CardSubtitle className="mt-2">
          {formatMoney(Number(pay.amount), pay.currency)}
        </CardSubtitle>
        <MockCheckout
          paymentId={pay.id}
          amount={Number(pay.amount)}
          currency={pay.currency}
          label={label}
          successRedirect={successRedirect}
        />
      </Card>
    </div>
  );
}
