import { inArray, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Showcase() {
  const me = await requireFacilitator();
  const memberships = await db
    .select()
    .from(schema.institutionMembers)
    .where(eq(schema.institutionMembers.userId, me.id));
  if (!memberships.length) {
    return (
      <Card>
        <CardTitle>You don&rsquo;t belong to an institution yet</CardTitle>
        <CardSubtitle>Admins can attach you to one.</CardSubtitle>
      </Card>
    );
  }

  const institutions = await db
    .select()
    .from(schema.institutions)
    .where(
      inArray(
        schema.institutions.id,
        memberships.map((m) => m.institutionId),
      ),
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Partner showcase</h1>
        <p className="text-sm text-plum-900/60">
          What couples see when picking a program.
        </p>
      </header>

      {institutions.map((i) => (
        <Card key={i.id}>
          <Badge tone={i.publicShowcase ? "mint" : "neutral"}>
            {i.publicShowcase ? "Public" : "Hidden"}
          </Badge>
          <CardTitle className="mt-2">{i.name}</CardTitle>
          <CardSubtitle>
            {i.city ?? "—"} · {i.country}
          </CardSubtitle>
        </Card>
      ))}
    </div>
  );
}
