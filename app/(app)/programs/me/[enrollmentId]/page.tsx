import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { markLessonComplete } from "../../[id]/actions";

export default async function MyEnrollment({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const user = await requireUser();

  const [e] = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.id, enrollmentId))
    .limit(1);
  if (!e) notFound();
  if (e.primaryUserId !== user.id && e.partnerUserId !== user.id) notFound();

  const [cohort] = await db
    .select()
    .from(schema.cohorts)
    .where(eq(schema.cohorts.id, e.cohortId))
    .limit(1);
  const [program] = await db
    .select()
    .from(schema.programs)
    .where(eq(schema.programs.id, cohort.programId))
    .limit(1);

  const lessons = await db
    .select()
    .from(schema.programLessons)
    .where(eq(schema.programLessons.programId, program.id))
    .orderBy(asc(schema.programLessons.week));

  const completions = await db
    .select()
    .from(schema.lessonCompletions)
    .where(eq(schema.lessonCompletions.enrollmentId, e.id));
  const doneIds = new Set(completions.map((c) => c.lessonId));

  // Coaching notes visible to the couple.
  const notes = await db
    .select()
    .from(schema.coachingNotes)
    .where(eq(schema.coachingNotes.enrollmentId, e.id));

  const graduated = e.status === "graduated";
  const allDone = lessons.length > 0 && doneIds.size === lessons.length;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <Badge tone="amber">{program.kind.replaceAll("_", " ")}</Badge>
        <h1 className="text-display text-3xl text-plum-900 mt-2">
          {program.title}
        </h1>
        <p className="text-sm text-plum-900/60">
          Cohort: {cohort.name} · {doneIds.size}/{lessons.length} lessons done
        </p>
        {graduated && (
          <Badge tone="mint" className="mt-3">
            Graduated — Marital Legacy unlocked
          </Badge>
        )}
        {allDone && !graduated && (
          <p className="mt-3 text-xs text-plum-900/50">
            Awaiting facilitator graduation verification.
          </p>
        )}
      </header>

      <ol className="space-y-3">
        {lessons.map((l) => (
          <Card key={l.id}>
            <p className="text-xs text-plum-900/50 font-mono mb-1">
              Week {l.week}
            </p>
            <CardTitle>{l.title}</CardTitle>
            {l.body && (
              <CardSubtitle className="mt-2 whitespace-pre-line">
                {l.body}
              </CardSubtitle>
            )}
            {doneIds.has(l.id) ? (
              <Badge tone="mint" className="mt-3">
                Complete
              </Badge>
            ) : (
              <form action={markLessonComplete} className="mt-3 space-y-2">
                <input type="hidden" name="enrollmentId" value={e.id} />
                <input type="hidden" name="lessonId" value={l.id} />
                <Textarea
                  name="reflection"
                  placeholder="A reflection from this week (optional)"
                  rows={3}
                />
                <Button type="submit">Mark complete</Button>
              </form>
            )}
          </Card>
        ))}
      </ol>

      {notes.length > 0 && (
        <Card>
          <CardTitle>Coaching notes</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {notes.map((n) => (
              <li key={n.id} className="rounded-2xl bg-plum-900/3 p-3">
                {n.body}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {graduated && (
        <Card>
          <CardTitle>Your Legacy Certificate</CardTitle>
          <CardSubtitle>Ready to print and frame.</CardSubtitle>
          <a
            href={`/programs/me/${e.id}/certificate`}
            target="_blank"
            className="inline-block mt-3 text-sm underline text-plum-900"
          >
            Open certificate →
          </a>
        </Card>
      )}
    </div>
  );
}
