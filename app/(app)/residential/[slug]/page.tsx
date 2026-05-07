import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [p] = await db.select().from(properties).where(eq(properties.slug, slug)).limit(1);
  if (!p || p.status !== "published") notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <Link
        href="/residential"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Residential
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-stone-500">{p.city}</span>
          {p.aganoCertified && <Badge variant="success">Agano-certified</Badge>}
          <Badge variant="muted">{p.type}</Badge>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{p.title}</h1>
        {p.address && <p className="text-sm text-stone-500">{p.address}</p>}
      </header>

      {p.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {p.photos.slice(0, 8).map((url, i) => (
            <div
              key={i}
              className="aspect-square overflow-hidden rounded-2xl bg-stone-200 bg-cover bg-center"
              style={{ backgroundImage: `url("${url}")` }}
            />
          ))}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>About this stay</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm leading-relaxed text-stone-700">
            {p.description && <p className="whitespace-pre-line">{p.description}</p>}
            <div>
              <p className="text-[11px] uppercase tracking-wide text-stone-400">Sleeps</p>
              <p className="mt-1">
                Up to {p.maxGuests} guests · {p.bedrooms} bedroom{p.bedrooms === 1 ? "" : "s"}
              </p>
            </div>
            {p.amenities.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Amenities</p>
                <p className="mt-1">{p.amenities.join(" · ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stay here</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-2xl font-semibold tracking-tight">
              {formatKes(p.basePriceKes)}
              <span className="ml-1 text-xs font-normal text-stone-500">/ night</span>
            </p>
            {p.cleaningFeeKes > 0 && (
              <p className="text-xs text-stone-500">
                + {formatKes(p.cleaningFeeKes)} cleaning fee
              </p>
            )}
            <Button asChild size="lg">
              <Link href="/concierge">Request dates</Link>
            </Button>
            <p className="text-xs text-stone-500">
              The full booking calendar with M-Pesa payment is coming soon. For now, the Concierge
              handles bookings to make sure dates and the host are aligned.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
