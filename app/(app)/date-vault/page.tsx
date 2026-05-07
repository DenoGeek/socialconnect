import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dateIdeas, partnerLocations } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Date Vault · Evermore",
  description: "Curated date ideas and partner perks for couples.",
};

const BUDGETS = ["shoestring", "mid", "splurge"] as const;

export default async function DateVaultPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; budget?: string }>;
}) {
  const sp = await searchParams;
  const budget = (BUDGETS as readonly string[]).includes(sp.budget ?? "")
    ? (sp.budget as (typeof BUDGETS)[number])
    : null;

  const conditions = [];
  if (sp.city) conditions.push(eq(dateIdeas.city, sp.city));
  if (budget) conditions.push(eq(dateIdeas.budgetTier, budget));
  const ideas = await db
    .select()
    .from(dateIdeas)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(dateIdeas.title));

  const perks = await db
    .select()
    .from(partnerLocations)
    .where(
      sp.city
        ? and(eq(partnerLocations.active, true), eq(partnerLocations.city, sp.city))
        : eq(partnerLocations.active, true),
    )
    .orderBy(asc(partnerLocations.name));

  const cities = Array.from(
    new Set([...ideas.map((i) => i.city ?? "").filter(Boolean), ...perks.map((p) => p.city)]),
  ).sort();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Date Vault</span>
        <h1 className="text-4xl font-semibold tracking-tight">A small library of good ideas.</h1>
        <p className="text-base leading-relaxed text-stone-600">
          A curated list — not a search engine. Each idea has been tested by someone we trust.
          Partner perks below get you a quiet discount when you mention Evermore.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs">
        <FilterPill href="/date-vault" active={!sp.city && !budget} label="Everything" />
        {BUDGETS.map((b) => (
          <FilterPill
            key={b}
            href={`/date-vault?budget=${b}`}
            active={budget === b && !sp.city}
            label={b}
          />
        ))}
        {cities.map((c) => (
          <FilterPill
            key={c}
            href={`/date-vault?city=${encodeURIComponent(c)}`}
            active={sp.city === c}
            label={c}
          />
        ))}
      </nav>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-medium tracking-tight">Date ideas</h2>
        {ideas.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-stone-500">
              <p>The vault is being filled. Check back next week.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <Card>
                  <div
                    className="aspect-[4/3] rounded-t-2xl bg-stone-200 bg-cover bg-center"
                    style={{
                      backgroundImage: idea.coverImageUrl
                        ? `url("${idea.coverImageUrl}")`
                        : undefined,
                    }}
                  />
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      {idea.budgetTier && <Badge variant="muted">{idea.budgetTier}</Badge>}
                      {idea.vibe && <span className="text-xs text-stone-500">{idea.vibe}</span>}
                    </div>
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    {idea.city && <CardDescription>{idea.city}</CardDescription>}
                  </CardHeader>
                  {idea.description && (
                    <CardContent>
                      <p className="text-sm leading-relaxed text-stone-700">{idea.description}</p>
                    </CardContent>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-medium tracking-tight">Partner perks</h2>
        {perks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-stone-500">
              No partner perks yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {perks.map((perk) => (
              <li key={perk.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{perk.name}</CardTitle>
                        <CardDescription>
                          {perk.category} · {perk.city}
                        </CardDescription>
                      </div>
                      {perk.discountPercent && (
                        <Badge variant="success">-{perk.discountPercent}%</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-stone-700">
                    {perk.description && <p>{perk.description}</p>}
                    {perk.discountCode && (
                      <p className="text-xs text-stone-500">
                        Code:{" "}
                        <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-stone-700">
                          {perk.discountCode}
                        </span>
                      </p>
                    )}
                    {perk.bookingUrl && (
                      <Link
                        href={perk.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
                      >
                        Book ↗
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 capitalize transition-colors ${
        active
          ? "border-stone-900 bg-stone-900 text-stone-50"
          : "border-stone-300 text-stone-700 hover:border-stone-500"
      }`}
    >
      {label}
    </Link>
  );
}
