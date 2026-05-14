import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";

export default async function TripBookingDetail({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await requireUser();
  const [b] = await db
    .select()
    .from(schema.tripBookings)
    .where(eq(schema.tripBookings.id, bookingId))
    .limit(1);
  if (!b || b.primaryUserId !== user.id) notFound();

  const installments = await db
    .select()
    .from(schema.tripInstallments)
    .where(eq(schema.tripInstallments.bookingId, b.id))
    .orderBy(asc(schema.tripInstallments.dueOn));

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Trip reserved</h1>
        <p className="text-sm text-plum-900/60">
          {formatMoney(b.total, b.currency as "USD" | "KSH")} total
        </p>
      </header>
      <Card>
        <CardTitle>Installments</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8">
          {installments.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <p className="text-plum-900">
                  {new Date(i.dueOn).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-plum-900/50">
                  {formatMoney(i.amount, b.currency as "USD" | "KSH")}
                </p>
              </div>
              {i.paidAt ? (
                <Badge tone="mint">Paid</Badge>
              ) : (
                <Badge tone="neutral">Due</Badge>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
