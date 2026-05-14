import { inArray, eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadLesson } from "./actions";

export default async function Curriculum() {
  const me = await requireFacilitator();
  const memberships = await db
    .select()
    .from(schema.institutionMembers)
    .where(eq(schema.institutionMembers.userId, me.id));

  let programs: Array<typeof schema.programs.$inferSelect> = [];
  if (memberships.length) {
    programs = await db
      .select()
      .from(schema.programs)
      .where(
        inArray(
          schema.programs.institutionId,
          memberships.map((m) => m.institutionId),
        ),
      );
  }

  // For each program, list lessons.
  const programLessons = await Promise.all(
    programs.map(async (p) => ({
      program: p,
      lessons: await db
        .select()
        .from(schema.programLessons)
        .where(eq(schema.programLessons.programId, p.id))
        .orderBy(asc(schema.programLessons.week)),
    })),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Curriculum</h1>
        <p className="text-sm text-plum-900/60">
          Upload Connection Boxes, videos, and weekly notes.
        </p>
      </header>

      {programLessons.map(({ program, lessons }) => (
        <Card key={program.id}>
          <CardTitle>{program.title}</CardTitle>
          <CardSubtitle>{program.durationWeeks} weeks</CardSubtitle>
          <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
            {lessons.map((l) => (
              <li key={l.id} className="py-2">
                Week {l.week} · {l.title}
              </li>
            ))}
          </ul>
          <details className="mt-4">
            <summary className="text-sm underline cursor-pointer text-plum-900">
              Add lesson
            </summary>
            <form action={uploadLesson} className="mt-3 space-y-2">
              <input type="hidden" name="programId" value={program.id} />
              <div className="grid grid-cols-2 gap-2">
                <Input name="week" type="number" placeholder="Week" required />
                <Input name="title" placeholder="Title" required />
              </div>
              <Textarea name="body" placeholder="Session notes" />
              <Input name="videoUrl" placeholder="Video URL" />
              <Input
                name="connectionBoxUrl"
                placeholder="Connection Box URL"
              />
              <Button type="submit">Save</Button>
            </form>
          </details>
        </Card>
      ))}
    </div>
  );
}
