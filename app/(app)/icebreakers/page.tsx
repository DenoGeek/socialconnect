import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function IcebreakersPage() {
  await requireUser();
  const prompts = await db
    .select()
    .from(schema.icebreakerPrompts)
    .where(eq(schema.icebreakerPrompts.active, true))
    .orderBy(asc(schema.icebreakerPrompts.ordering));

  const byCategory = prompts.reduce<Record<string, typeof prompts>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Icebreaker Corner</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          Conversation starters for events and mutual matches — always available.
        </p>
      </header>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-display text-xl text-plum-900 capitalize">{category}</h2>
          {items.map((p) => (
            <Card key={p.id}>
              <Badge tone="mint">{category}</Badge>
              <CardTitle className="mt-2 text-lg">{p.prompt}</CardTitle>
              <CardSubtitle className="mt-2">
                Use this at a mixer, or send it in a mutual-match chat.
              </CardSubtitle>
            </Card>
          ))}
        </section>
      ))}

      {prompts.length === 0 && (
        <Card>
          <CardTitle>Prompts coming soon</CardTitle>
          <CardSubtitle>Staff are adding icebreakers to the library.</CardSubtitle>
        </Card>
      )}
    </div>
  );
}
