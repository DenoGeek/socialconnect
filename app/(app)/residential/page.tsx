import Link from "next/link";
import { and, eq, ilike, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";

export default async function ResidentialIndex({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    type?: string;
    certified?: string;
    landmark?: string;
    radiusKm?: string;
    minRooms?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const filters = [eq(schema.hearthProperties.active, true)];
  if (sp.region) {
    filters.push(ilike(schema.hearthProperties.region, `%${sp.region}%`));
  }
  if (sp.type) {
    filters.push(
      eq(schema.hearthProperties.propertyType, sp.type as never),
    );
  }
  if (sp.certified === "1") {
    filters.push(eq(schema.hearthProperties.aganoCertified, true));
  }
  if (sp.landmark) {
    filters.push(
      sql`${schema.hearthProperties.landmarkTags} @> ${JSON.stringify([sp.landmark])}::jsonb`,
    );
  }
  if (sp.minRooms) {
    filters.push(
      gte(schema.hearthProperties.maxOccupancy, Number(sp.minRooms) * 2),
    );
  }
  // Hide elite-only properties from non-elite users.
  if (user.tier !== "elite") {
    filters.push(eq(schema.hearthProperties.isElitePrivate, false));
  }

  const rows = await db
    .select()
    .from(schema.hearthProperties)
    .where(and(...filters))
    .limit(60);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Agano Hearth</h1>
        <p className="text-sm text-plum-900/60">
          Modern-Rustic stays. Curated for couples. Some include the Connection
          Box.
        </p>
      </header>

      <form className="flex flex-wrap gap-2 text-sm">
        <FilterPill name="region" value={sp.region} placeholder="Region" />
        <FilterPill name="type" value={sp.type} placeholder="Type" />
        <FilterPill name="landmark" value={sp.landmark} placeholder="Near…" />
        <select
          name="certified"
          defaultValue={sp.certified ?? ""}
          className="rounded-full bg-plum-900/5 px-3 py-1.5"
        >
          <option value="">Any badge</option>
          <option value="1">Agano Certified only</option>
        </select>
        <button className="rounded-full bg-plum-900 text-plum-100 px-4 py-1.5">
          Apply
        </button>
      </form>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <Link key={p.id} href={`/residential/${p.slug}`} className="group block">
            <article className="rounded-3xl overflow-hidden bg-white border border-plum-900/8 shadow-sm hover:shadow-md transition">
              <div
                className="h-44 bg-cover bg-center bg-plum-900"
                style={{
                  backgroundImage: p.gallery?.[0]
                    ? `url(${p.gallery[0]})`
                    : undefined,
                }}
              />
              <div className="p-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge tone="neutral">{p.propertyType.replaceAll("_", " ")}</Badge>
                  {p.aganoCertified && <Badge tone="mint">Agano Certified</Badge>}
                  {p.isElitePrivate && <Badge tone="amber">Elite</Badge>}
                </div>
                <h3 className="text-display text-lg text-plum-900 group-hover:underline">
                  {p.title}
                </h3>
                <p className="text-xs text-plum-900/60 mt-1">
                  {p.region} · {p.city}
                </p>
                <p className="text-sm text-plum-900 mt-3">
                  {formatMoney(p.nightlyRateKsh, "KSH")} /night
                </p>
              </div>
            </article>
          </Link>
        ))}
        {rows.length === 0 && (
          <Card>
            <CardTitle>No properties matched.</CardTitle>
            <CardSubtitle>Try widening your filters.</CardSubtitle>
          </Card>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  name,
  value,
  placeholder,
}: {
  name: string;
  value?: string;
  placeholder: string;
}) {
  return (
    <input
      name={name}
      defaultValue={value ?? ""}
      placeholder={placeholder}
      className="rounded-full bg-plum-900/5 px-3 py-1.5 outline-none focus:bg-white focus:border focus:border-plum-900/20"
    />
  );
}
