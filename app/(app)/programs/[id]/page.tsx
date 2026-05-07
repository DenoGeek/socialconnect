import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cohorts, partners, programs } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [row] = await db
    .select({ program: programs, partner: partners })
    .from(programs)
    .innerJoin(partners, eq(partners.id, programs.partnerId))
    .where(eq(programs.id, id))
    .limit(1);
  if (!row || !row.program.published) notFound();
  const { program, partner } = row;

  const upcomingCohorts = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.programId, program.id))
    .orderBy(asc(cohorts.startsOn));

  const future = upcomingCohorts.filter((c) => c.startsOn.getTime() >= Date.now());

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <Link
        href="/programs"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Programs
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="muted">{program.kind}</Badge>
          <span className="text-xs uppercase tracking-wide text-stone-500">{partner.name}</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{program.title}</h1>
        {program.summary && (
          <p className="max-w-2xl text-base leading-relaxed text-stone-600">{program.summary}</p>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>About this program</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-stone-700">
            {partner.description && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">About {partner.name}</p>
                <p className="mt-1 leading-relaxed">{partner.description}</p>
              </div>
            )}
            {program.durationWeeks && (
              <p>
                <span className="text-[11px] uppercase tracking-wide text-stone-400">Duration: </span>
                {program.durationWeeks} weeks
              </p>
            )}
            {program.location && (
              <p>
                <span className="text-[11px] uppercase tracking-wide text-stone-400">Where: </span>
                {program.location}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming cohorts</CardTitle>
            <CardDescription>
              {program.feeKes > 0 ? formatKes(program.feeKes) : "Free"} per couple
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {future.length === 0 ? (
              <p className="text-sm text-stone-500">No upcoming cohorts. Check back soon.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {future.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-stone-500">
                        Starts{" "}
                        {c.startsOn.toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant="muted">
                      {c.enrolledCount}/{c.capacity}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild disabled={future.length === 0}>
              <Link href="/concierge">Enroll with concierge</Link>
            </Button>
            <p className="text-xs text-stone-500">
              Enrollment is concierge-mediated in v1 — we make sure you and your partner are placed
              in the same cohort and that the facilitator has what they need before you start.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
