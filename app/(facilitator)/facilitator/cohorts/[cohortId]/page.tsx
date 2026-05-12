import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCoachingNote, verifyGraduation } from "./actions";

export default async function CohortDetail({
  params,
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const { cohortId } = await params;
  await requireFacilitator();

  const [cohort] = await db
    .select()
    .from(schema.cohorts)
    .where(eq(schema.cohorts.id, cohortId))
    .limit(1);
  if (!cohort) notFound();

  const [program] = await db
    .select()
    .from(schema.programs)
    .where(eq(schema.programs.id, cohort.programId))
    .limit(1);

  const enrolls = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.cohortId, cohort.id));

  const lessons = await db
    .select()
    .from(schema.programLessons)
    .where(eq(schema.programLessons.programId, cohort.programId))
    .orderBy(asc(schema.programLessons.week));

  // For each enrollment, count completions.
  const enrichedEnrolls = await Promise.all(
    enrolls.map(async (e) => {
      const completions = await db
        .select()
        .from(schema.lessonCompletions)
        .where(eq(schema.lessonCompletions.enrollmentId, e.id));
      return { e, doneCount: completions.length };
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{cohort.name}</h1>
        <p className="text-sm text-plum-900/60">{program.title}</p>
      </header>

      <Card>
        <CardTitle>Enrolled couples ({enrichedEnrolls.length})</CardTitle>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Primary</th>
              <th>Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {enrichedEnrolls.map(({ e, doneCount }) => (
              <tr key={e.id}>
                <td className="py-2 text-xs font-mono">{e.primaryUserId.slice(0, 8)}…</td>
                <td>
                  {doneCount}/{lessons.length}
                  {doneCount < lessons.length && (
                    <Badge tone="amber" className="ml-2">
                      In progress
                    </Badge>
                  )}
                </td>
                <td>
                  <Badge
                    tone={e.status === "graduated" ? "mint" : "neutral"}
                  >
                    {e.status}
                  </Badge>
                </td>
                <td className="space-y-1">
                  {doneCount === lessons.length &&
                    e.status !== "graduated" && (
                      <form action={verifyGraduation}>
                        <input type="hidden" name="enrollmentId" value={e.id} />
                        <Button type="submit" size="sm">
                          Verify graduation
                        </Button>
                      </form>
                    )}
                  <details>
                    <summary className="text-xs underline text-plum-900 cursor-pointer">
                      Coaching note
                    </summary>
                    <form action={addCoachingNote} className="mt-2 space-y-2">
                      <input
                        type="hidden"
                        name="enrollmentId"
                        value={e.id}
                      />
                      <Textarea name="body" rows={2} required />
                      <Button type="submit" size="sm">
                        Save note
                      </Button>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
