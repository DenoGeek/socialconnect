import { AppLink } from "@/components/nav/app-link";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Professionals({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const filters = [eq(schema.professionals.active, true)];
  if (sp.specialty) {
    filters.push(
      sql`${schema.professionals.specialties} @> ${JSON.stringify([sp.specialty])}::jsonb`,
    );
  }

  const rows = await db
    .select()
    .from(schema.professionals)
    .where(and(...filters));

  const SPECIALTIES = [
    "Communication",
    "Parenting",
    "Finances",
    "Pre-marital",
    "Trauma",
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Professional Directory
        </h1>
        <p className="text-sm text-plum-900/60">
          Vetted therapists, counsellors, and coaches.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <AppLink
          href="/professionals"
          className={`rounded-full px-3 py-1.5 ${
            !sp.specialty
              ? "bg-plum-900 text-plum-100"
              : "bg-plum-900/5 text-plum-900"
          }`}
        >
          All
        </AppLink>
        {SPECIALTIES.map((s) => (
          <AppLink
            key={s}
            href={`/professionals?specialty=${encodeURIComponent(s)}`}
            className={`rounded-full px-3 py-1.5 ${
              sp.specialty === s
                ? "bg-plum-900 text-plum-100"
                : "bg-plum-900/5 text-plum-900"
            }`}
          >
            {s}
          </AppLink>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <AppLink key={p.id} href={`/professionals/${p.id}`}>
            <Card>
              <CardTitle>{p.fullName}</CardTitle>
              <CardSubtitle>{p.city ?? "Online"}</CardSubtitle>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.specialties.map((s: string) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
                {p.teleHealthEnabled && (
                  <Badge tone="teal">Tele-health</Badge>
                )}
              </div>
            </Card>
          </AppLink>
        ))}
      </div>
    </div>
  );
}
