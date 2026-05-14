import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatMoney } from "@/lib/utils/format";
import { TripBookingForm } from "./booking-form";

export default async function TripDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const [t] = await db
    .select()
    .from(schema.trips)
    .where(eq(schema.trips.slug, slug))
    .limit(1);
  if (!t) notFound();

  return (
    <article className="space-y-6 max-w-2xl">
      <div
        className="rounded-3xl h-72 bg-cover bg-center bg-plum-900"
        style={{
          backgroundImage: t.gallery?.[0] ? `url(${t.gallery[0]})` : undefined,
        }}
      />
      <header>
        <div className="flex gap-2 flex-wrap mb-2">
          <Badge tone="plum">{t.scope}</Badge>
          {t.curriculumIncluded && <Badge tone="mint">Curriculum</Badge>}
          {t.facilitatorIncluded && <Badge tone="teal">Facilitator</Badge>}
        </div>
        <h1 className="text-display text-4xl text-plum-900">{t.title}</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          {formatDateRange(t.startsOn, t.endsOn)} · {t.region}
        </p>
      </header>
      {t.inclusiveDescription && (
        <Card>
          <CardTitle>What&rsquo;s inclusive</CardTitle>
          <CardSubtitle className="whitespace-pre-line mt-2">
            {t.inclusiveDescription}
          </CardSubtitle>
        </Card>
      )}
      <TripBookingForm
        trip={{
          id: t.id,
          slug: t.slug,
          totalUsd: Number(t.totalUsd),
          totalKsh: Number(t.totalKsh),
        }}
        userId={user.id}
      />
    </article>
  );
}
