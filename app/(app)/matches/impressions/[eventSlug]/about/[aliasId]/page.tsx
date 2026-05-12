import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AboutAliasPage({
  params,
}: {
  params: Promise<{ eventSlug: string; aliasId: string }>;
}) {
  const { aliasId } = await params;
  await requireUser();

  // aliasId is the alias_assignment.id
  const [row] = await db
    .select({
      assignment: schema.aliasAssignments,
      alias: schema.aliasPool,
      profile: schema.profiles,
    })
    .from(schema.aliasAssignments)
    .innerJoin(
      schema.aliasPool,
      eq(schema.aliasPool.id, schema.aliasAssignments.aliasId),
    )
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.userId, schema.aliasAssignments.userId),
    )
    .where(eq(schema.aliasAssignments.id, aliasId))
    .limit(1);
  if (!row) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <p className="text-xs text-plum-900/50 uppercase tracking-widest">
          Alias card
        </p>
        <h1 className="text-display text-3xl text-plum-900">
          {row.alias.name}
        </h1>
        <p className="text-sm text-plum-900/60">
          Their identity stays hidden until you both opt in.
        </p>
      </header>

      <Card>
        <CardTitle>Their dream date</CardTitle>
        <CardSubtitle>
          {row.profile?.dreamDate ?? "They haven't shared yet."}
        </CardSubtitle>
      </Card>

      <Card>
        <CardTitle>What they signal</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {(row.profile?.intentBadges ?? []).map((b) => (
            <Badge key={b} tone="plum">
              {b.replaceAll("_", " ")}
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(row.profile?.interests ?? []).map((i) => (
            <Badge key={i} tone="neutral">
              {i}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
