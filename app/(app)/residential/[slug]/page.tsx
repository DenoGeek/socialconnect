import { notFound } from "next/navigation";
import { and, eq, gte, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";
import { BookingForm } from "./booking-form";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();
  const [p] = await db
    .select()
    .from(schema.hearthProperties)
    .where(eq(schema.hearthProperties.slug, slug))
    .limit(1);
  if (!p) notFound();

  const addOns = await db
    .select()
    .from(schema.propertyAddOns)
    .where(eq(schema.propertyAddOns.propertyId, p.id));

  // Future bookings blocking dates.
  const now = new Date();
  const upcoming = await db
    .select({
      checkIn: schema.hearthBookings.checkIn,
      checkOut: schema.hearthBookings.checkOut,
    })
    .from(schema.hearthBookings)
    .where(
      and(
        eq(schema.hearthBookings.propertyId, p.id),
        gte(schema.hearthBookings.checkOut, now),
        ne(schema.hearthBookings.status, "cancelled"),
      ),
    );

  return (
    <article className="space-y-6">
      <div
        className="rounded-3xl h-72 bg-cover bg-center bg-plum-900"
        style={{
          backgroundImage: p.gallery?.[0] ? `url(${p.gallery[0]})` : undefined,
        }}
      />
      <header>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge tone="plum">{p.region}</Badge>
          {p.aganoCertified && <Badge tone="mint">Agano Certified</Badge>}
          {p.connectionBoxIncluded && (
            <Badge tone="teal">Connection Box included</Badge>
          )}
        </div>
        <h1 className="text-display text-4xl text-plum-900">{p.title}</h1>
        <p className="text-sm text-plum-900/60 mt-1">{p.city}</p>
      </header>

      {p.description && (
        <Card>
          <p className="text-sm text-plum-900/80 whitespace-pre-line">
            {p.description}
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Amenities</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {(p.amenities ?? []).map((a) => (
            <Badge key={a} tone="neutral">
              {a}
            </Badge>
          ))}
        </div>
      </Card>

      <BookingForm
        property={{
          id: p.id,
          slug: p.slug,
          title: p.title,
          nightlyKsh: Number(p.nightlyRateKsh),
          nightlyUsd: Number(p.nightlyRateUsd),
          minNights: p.minNights,
          maxOccupancy: p.maxOccupancy,
        }}
        addOns={addOns.map((a) => ({
          id: a.id,
          name: a.name,
          priceKsh: Number(a.priceKsh),
          priceUsd: Number(a.priceUsd),
        }))}
        bookedRanges={upcoming.map((b) => ({
          from: b.checkIn.toISOString(),
          to: b.checkOut.toISOString(),
        }))}
      />

      <Card>
        <CardTitle>House notes</CardTitle>
        <CardSubtitle>
          Sleeps {p.maxOccupancy}. {p.minNights}-night minimum.
        </CardSubtitle>
        <p className="text-sm text-plum-900/70 mt-2">
          Once booked, your digital key code is issued 24 hours before
          check-in.
        </p>
      </Card>
    </article>
  );
}
