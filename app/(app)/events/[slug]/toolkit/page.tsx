import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Toolkit } from "./toolkit";
import { getAlias } from "@/lib/alias/assign";

export default async function ToolkitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, slug))
    .limit(1);
  if (!event) notFound();

  // Must have a confirmed ticket.
  const [purchase] = await db
    .select()
    .from(schema.ticketPurchases)
    .where(eq(schema.ticketPurchases.userId, user.id))
    .limit(1);
  if (!purchase || purchase.eventId !== event.id) {
    return (
      <Card>
        <CardTitle>Toolkit locked</CardTitle>
        <CardSubtitle>
          Purchase a ticket and check in at the venue to unlock the toolkit.
        </CardSubtitle>
      </Card>
    );
  }

  const prompts = await db
    .select()
    .from(schema.eventPrompts)
    .where(eq(schema.eventPrompts.eventId, event.id))
    .orderBy(asc(schema.eventPrompts.ordering));

  const myResponses = await db
    .select()
    .from(schema.eventPromptResponses)
    .where(eq(schema.eventPromptResponses.userId, user.id));

  const notes = await db
    .select({
      note: schema.interactionNotes,
    })
    .from(schema.interactionNotes)
    .where(eq(schema.interactionNotes.authorUserId, user.id));

  const allAliases = await db
    .select({
      assignment: schema.aliasAssignments,
      alias: schema.aliasPool,
    })
    .from(schema.aliasAssignments)
    .innerJoin(
      schema.aliasPool,
      eq(schema.aliasPool.id, schema.aliasAssignments.aliasId),
    )
    .where(eq(schema.aliasAssignments.eventId, event.id));

  const myAlias = await getAlias(user.id, event.id);

  return (
    <Toolkit
      event={{ id: event.id, title: event.title, slug: event.slug }}
      prompts={prompts.map((p) => ({
        id: p.id,
        kind: p.kind,
        prompt: p.prompt,
      }))}
      myAlias={myAlias?.alias.name ?? null}
      aliases={allAliases
        .filter((a) => a.assignment.userId !== user.id)
        .map((a) => ({ id: a.assignment.id, name: a.alias.name }))}
      existingResponses={myResponses.map((r) => ({
        promptId: r.promptId,
        response: r.response,
      }))}
      existingNotes={notes.map((n) => ({
        id: n.note.id,
        subjectAliasId: n.note.subjectAliasId,
        body: n.note.body,
      }))}
    />
  );
}
