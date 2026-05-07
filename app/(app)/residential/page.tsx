import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, tripPackages } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKes } from "@/lib/utils/format";

export const metadata = {
  title: "Residential · Evermore",
  description: "Modern-rustic stays and trip packages — for retreats and quiet weekends.",
};

export default async function ResidentialPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const sp = await searchParams;

  const where = sp.city
    ? and(eq(properties.status, "published"), eq(properties.city, sp.city))
    : eq(properties.status, "published");

  const props = await db.select().from(properties).where(where).orderBy(asc(properties.title));

  const trips = await db
    .select()
    .from(tripPackages)
    .where(eq(tripPackages.published, true))
    .orderBy(asc(tripPackages.title));

  const cities = Array.from(new Set(props.map((p) => p.city))).sort();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Residential</span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Quiet places, hand-picked.
        </h1>
        <p className="text-base leading-relaxed text-stone-600">
          A small portfolio of modern-rustic homes and curated weekend itineraries. Some are ours,
          some belong to verified hosts who&apos;ve earned the Agano mark. All are built for
          presence — fewer screens, better light, more time.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-medium tracking-tight">Stays</h2>
          {cities.length > 1 && (
            <nav className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/residential"
                className={`rounded-full border px-3 py-1 transition-colors ${
                  !sp.city
                    ? "border-stone-900 bg-stone-900 text-stone-50"
                    : "border-stone-300 text-stone-700 hover:border-stone-500"
                }`}
              >
                All
              </Link>
              {cities.map((c) => (
                <Link
                  key={c}
                  href={`/residential?city=${encodeURIComponent(c)}`}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    sp.city === c
                      ? "border-stone-900 bg-stone-900 text-stone-50"
                      : "border-stone-300 text-stone-700 hover:border-stone-500"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {props.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-stone-500">
              <p>No published properties yet.</p>
              <p className="mt-2 text-xs text-stone-400">
                Hosts: apply for Agano certification through the partner portal.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {props.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/residential/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition-colors hover:border-stone-400"
                >
                  <div
                    className="aspect-[4/3] bg-stone-200 bg-cover bg-center"
                    style={{
                      backgroundImage: p.photos[0] ? `url("${p.photos[0]}")` : undefined,
                    }}
                  />
                  <div className="flex flex-col gap-2 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-wide text-stone-500">{p.city}</span>
                      {p.aganoCertified && <Badge variant="success">Agano</Badge>}
                    </div>
                    <h3 className="text-lg font-medium tracking-tight group-hover:text-stone-700">
                      {p.title}
                    </h3>
                    <p className="text-sm text-stone-600">
                      Sleeps {p.maxGuests} · {p.bedrooms} bedroom{p.bedrooms === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">{formatKes(p.basePriceKes)}</span>
                      <span className="text-xs text-stone-500"> / night</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {trips.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-medium tracking-tight">Trip packages</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Card>
                  <div
                    className="aspect-[16/10] rounded-t-2xl bg-stone-200 bg-cover bg-center"
                    style={{
                      backgroundImage: trip.coverImageUrl ? `url("${trip.coverImageUrl}")` : undefined,
                    }}
                  />
                  <CardHeader>
                    <CardTitle>{trip.title}</CardTitle>
                    <CardDescription>{trip.durationDays} days · from {formatKes(trip.priceKes)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trip.description && <p className="text-sm text-stone-600">{trip.description}</p>}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
