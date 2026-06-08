import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { simulateSovereignPayment, simulateActivationPayment } from "./actions";

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

  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Zahari fees</h1>
        <p className="text-sm text-plum-900/70">
          Secure payment for your sovereign search and covenant activation.
        </p>
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
          <form action={simulateSovereignPayment} className="mt-4">
            <Button type="submit" className="w-full">
              Simulate payment
            </Button>
          </form>
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
