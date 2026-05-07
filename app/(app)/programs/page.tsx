import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cohorts, partners, programs } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKes } from "@/lib/utils/format";

export const metadata = {
  title: "Programs · Evermore",
  description: "Premarital, marital, parental — programs from vetted partners.",
};

const KIND_LABEL: Record<string, string> = {
  premarital: "Premarital",
  marital: "Marital",
  parental: "Parental",
  counseling: "Counseling",
  other: "Other",
};

const KINDS = ["premarital", "marital", "parental", "counseling"] as const;

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  const kind = (KINDS as readonly string[]).includes(sp.kind ?? "")
    ? (sp.kind as (typeof KINDS)[number])
    : null;

  const where = kind
    ? and(eq(programs.published, true), eq(programs.kind, kind))
    : eq(programs.published, true);

  const rows = await db
    .select({
      program: programs,
      partner: partners,
    })
    .from(programs)
    .innerJoin(partners, eq(partners.id, programs.partnerId))
    .where(where)
    .orderBy(asc(programs.title));

  // Count of upcoming cohorts per program for a quick "starts soon" hint.
  const programIds = rows.map((r) => r.program.id);
  const cohortRows = programIds.length
    ? await db
        .select()
        .from(cohorts)
        .where(inArray(cohorts.programId, programIds))
    : [];
  const upcomingByProgram = new Map<string, number>();
  for (const c of cohortRows) {
    if (c.startsOn.getTime() >= Date.now()) {
      upcomingByProgram.set(c.programId, (upcomingByProgram.get(c.programId) ?? 0) + 1);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">The Lab</span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Programs that take a relationship seriously.
        </h1>
        <p className="text-base leading-relaxed text-stone-600">
          From premarital prep through years of partnership and parenthood. Each program is led by
          a vetted facilitator — a counsellor, a faith leader, a couple who&apos;ve done the work.
          Choose by season of life or by partner you trust.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/programs"
          className={`rounded-full border px-3 py-1 transition-colors ${
            !kind
              ? "border-stone-900 bg-stone-900 text-stone-50"
              : "border-stone-300 text-stone-700 hover:border-stone-500"
          }`}
        >
          Everything
        </Link>
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/programs?kind=${k}`}
            className={`rounded-full border px-3 py-1 transition-colors ${
              kind === k
                ? "border-stone-900 bg-stone-900 text-stone-50"
                : "border-stone-300 text-stone-700 hover:border-stone-500"
            }`}
          >
            {KIND_LABEL[k]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-stone-500">
            <p>No published programs yet.</p>
            <p className="mt-2 text-xs text-stone-400">
              Partners — churches, counsellors, retreat leaders — list programs here once approved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ program, partner }) => {
            const upcoming = upcomingByProgram.get(program.id) ?? 0;
            return (
              <li key={program.id}>
                <Link
                  href={`/programs/${program.id}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:border-stone-400"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted">{KIND_LABEL[program.kind] ?? program.kind}</Badge>
                    {upcoming > 0 && <span className="text-xs text-emerald-700">{upcoming} cohort{upcoming === 1 ? "" : "s"} ahead</span>}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">{partner.name}</p>
                    <h2 className="mt-1 text-lg font-medium tracking-tight group-hover:text-stone-700">
                      {program.title}
                    </h2>
                  </div>
                  {program.summary && (
                    <p className="line-clamp-3 text-sm text-stone-600">{program.summary}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="text-stone-500">
                      {program.location ?? "Location varies"}
                    </span>
                    <span className="font-medium">
                      {program.feeKes > 0 ? formatKes(program.feeKes) : "Free"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
