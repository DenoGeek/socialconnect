import { AppLink } from "@/components/nav/app-link";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const filters = [eq(schema.programs.active, true)];
  if (sp.kind)
    filters.push(eq(schema.programs.kind, sp.kind as never));

  const rows = await db
    .select({
      program: schema.programs,
      institution: schema.institutions,
    })
    .from(schema.programs)
    .leftJoin(
      schema.institutions,
      eq(schema.institutions.id, schema.programs.institutionId),
    )
    .where(and(...filters));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Relationship Education Hub
        </h1>
        <p className="text-sm text-plum-900/60">
          Pre-marital, marital, and parental tracks delivered with church
          partners.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { v: "", l: "All" },
          { v: "agano_ascent", l: "Agano Ascent" },
          { v: "premarital", l: "Pre-Marital" },
          { v: "marital_legacy", l: "Marital Legacy" },
          { v: "parental_legacy", l: "Parental Legacy" },
        ].map((b) => (
          <AppLink
            key={b.v}
            href={`/programs${b.v ? `?kind=${b.v}` : ""}`}
            className={`rounded-full px-3 py-1.5 ${
              (sp.kind ?? "") === b.v
                ? "bg-plum-900 text-plum-100"
                : "bg-plum-900/5 text-plum-900"
            }`}
          >
            {b.l}
          </AppLink>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ program, institution }) => (
          <AppLink key={program.id} href={`/programs/${program.id}`}>
            <Card>
              <Badge tone="amber">{program.kind.replaceAll("_", " ")}</Badge>
              <CardTitle className="mt-2">{program.title}</CardTitle>
              <CardSubtitle>
                {program.durationWeeks} weeks ·{" "}
                {institution?.name ?? "Evermore in-house"}
              </CardSubtitle>
              {program.description && (
                <p className="text-sm text-plum-900/70 mt-2">
                  {program.description}
                </p>
              )}
            </Card>
          </AppLink>
        ))}
      </div>
    </div>
  );
}
