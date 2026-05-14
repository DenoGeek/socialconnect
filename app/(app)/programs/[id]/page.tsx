import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { enrollInProgram } from "./actions";

export default async function ProgramDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [program] = await db
    .select()
    .from(schema.programs)
    .where(eq(schema.programs.id, id))
    .limit(1);
  if (!program) notFound();

  const lessons = await db
    .select()
    .from(schema.programLessons)
    .where(eq(schema.programLessons.programId, program.id))
    .orderBy(asc(schema.programLessons.week));

  // Existing enrollment for this user.
  const enroll = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.primaryUserId, user.id))
    .limit(1);

  // Locking: Level 2 (uses unlocksProgramId) requires foundational completion.
  let locked = false;
  if (program.unlocksProgramId) {
    const foundation = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.primaryUserId, user.id));
    locked = !foundation.some(
      (e) => e.status === "graduated" || e.status === "completed",
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <Badge tone="amber">{program.kind.replaceAll("_", " ")}</Badge>
        <h1 className="text-display text-3xl text-plum-900 mt-2">
          {program.title}
        </h1>
        <p className="text-sm text-plum-900/60">
          {program.durationWeeks} weeks
        </p>
      </header>

      {locked && (
        <Card className="bg-amber-soft">
          <CardTitle>Locked</CardTitle>
          <CardSubtitle>
            Complete the foundational Agano Ascent before unlocking this track.
          </CardSubtitle>
        </Card>
      )}

      {program.description && (
        <Card>
          <p className="text-sm text-plum-900/80 whitespace-pre-line">
            {program.description}
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Curriculum</CardTitle>
        <ol className="mt-3 divide-y divide-plum-900/8">
          {lessons.map((l) => (
            <li key={l.id} className="py-3 text-sm">
              <span className="text-plum-900/50 mr-3 font-mono">
                W{l.week}
              </span>
              <span className="text-plum-900">{l.title}</span>
              {l.connectionBoxUrl && (
                <Link
                  href={l.connectionBoxUrl}
                  className="ml-3 text-xs underline text-plum-900/70"
                >
                  Connection Box →
                </Link>
              )}
            </li>
          ))}
          {lessons.length === 0 && (
            <CardSubtitle>Lessons publish at cohort start.</CardSubtitle>
          )}
        </ol>
      </Card>

      {!enroll[0] ? (
        <form action={enrollInProgram}>
          <input type="hidden" name="programId" value={program.id} />
          <Button type="submit" size="lg" disabled={locked}>
            Enroll
          </Button>
        </form>
      ) : (
        <Link href="/programs/me">
          <Button variant="outline">View my journey</Button>
        </Link>
      )}
    </div>
  );
}
