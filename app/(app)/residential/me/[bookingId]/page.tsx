import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatMoney } from "@/lib/utils/format";

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await requireUser();
  const [row] = await db
    .select({
      booking: schema.hearthBookings,
      property: schema.hearthProperties,
    })
    .from(schema.hearthBookings)
    .innerJoin(
      schema.hearthProperties,
      eq(schema.hearthProperties.id, schema.hearthBookings.propertyId),
    )
    .where(eq(schema.hearthBookings.id, bookingId))
    .limit(1);
  if (!row || row.booking.primaryUserId !== user.id) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <p className="text-xs text-plum-900/50 uppercase tracking-widest">
          Stay confirmed
        </p>
        <h1 className="text-display text-3xl text-plum-900">
          {row.property.title}
        </h1>
        <p className="text-sm text-plum-900/60">
          {formatDateRange(row.booking.checkIn, row.booking.checkOut)}
        </p>
      </header>

      <Card>
        <CardTitle>Stay mode</CardTitle>
        <CardSubtitle>
          24h before arrival you&rsquo;ll receive your digital key + house rules.
        </CardSubtitle>
        <p className="mt-4 font-mono text-2xl text-plum-900">
          Key: {row.booking.keyCode ?? "—"}
        </p>
        <Badge tone="mint" className="mt-3">
          {row.booking.status}
        </Badge>
      </Card>

      <Card>
        <CardTitle>Total</CardTitle>
        <p className="text-display text-2xl text-plum-900 mt-1">
          {formatMoney(
            row.booking.total,
            row.booking.currency as "KSH" | "USD",
          )}
        </p>
      </Card>
    </div>
  );
}
