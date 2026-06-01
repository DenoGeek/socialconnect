import { AppLink } from "@/components/nav/app-link";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FacilitatorLab() {
  const me = await requireFacilitator();

  // Institutions this facilitator belongs to.
  const memberships = await db
    .select()
    .from(schema.institutionMembers)
    .where(eq(schema.institutionMembers.userId, me.id));
  const institutionIds = memberships.map((m) => m.institutionId);

  let cohorts: Array<{
    cohort: typeof schema.cohorts.$inferSelect;
    program: typeof schema.programs.$inferSelect;
  }> = [];
  if (institutionIds.length) {
    cohorts = await db
      .select({
        cohort: schema.cohorts,
        program: schema.programs,
      })
      .from(schema.cohorts)
      .innerJoin(
        schema.programs,
        eq(schema.programs.id, schema.cohorts.programId),
      )
      .where(inArray(schema.programs.institutionId, institutionIds));
  }

  // Also include any cohorts where this facilitator is set as facilitator.
  const directCohorts = await db
    .select({
      cohort: schema.cohorts,
      program: schema.programs,
    })
    .from(schema.cohorts)
    .innerJoin(
      schema.programs,
      eq(schema.programs.id, schema.cohorts.programId),
    )
    .where(eq(schema.cohorts.facilitatorUserId, me.id));
  cohorts = [...cohorts, ...directCohorts];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Welcome to The Lab
        </h1>
        <p className="text-sm text-plum-900/60">
          Your cohorts and curriculum delivery.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {cohorts.map(({ cohort, program }) => (
          <AppLink
            key={cohort.id}
            href={`/facilitator/cohorts/${cohort.id}`}
            className="block"
          >
            <Card>
              <Badge tone="amber">{program.kind.replaceAll("_", " ")}</Badge>
              <CardTitle className="mt-2">{cohort.name}</CardTitle>
              <CardSubtitle>
                {program.title} ·{" "}
                {new Date(cohort.startsOn).toLocaleDateString("en-GB")}
              </CardSubtitle>
            </Card>
          </AppLink>
        ))}
        {cohorts.length === 0 && (
          <Card>
            <CardTitle>No cohorts yet</CardTitle>
            <CardSubtitle>
              Once an admin assigns cohorts to your institution they show up
              here.
            </CardSubtitle>
          </Card>
        )}
      </div>
    </div>
  );
}
