"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function submitBlindResponse(form: FormData) {
  const user = await requireUser();
  const promptId = String(form.get("promptId"));
  const partnerUserId = (form.get("partnerUserId") as string) || null;
  const response = String(form.get("response") ?? "").trim();
  if (!response) throw new Error("Response cannot be empty");

  await db
    .insert(schema.eventPromptResponses)
    .values({
      promptId,
      userId: user.id,
      partnerUserId: partnerUserId || undefined,
      response,
    })
    .onConflictDoUpdate({
      target: [
        schema.eventPromptResponses.promptId,
        schema.eventPromptResponses.userId,
      ],
      set: { response, submittedAt: new Date() },
    });

  revalidatePath("/events");
}

export async function saveInteractionNote(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get("eventId"));
  const subjectAliasId = String(form.get("subjectAliasId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;

  await db.insert(schema.interactionNotes).values({
    eventId,
    authorUserId: user.id,
    subjectAliasId,
    body,
  });
  revalidatePath("/events");
}

export async function getBlindReveal(promptId: string, partnerUserId: string) {
  const user = await requireUser();
  const mine = await db
    .select()
    .from(schema.eventPromptResponses)
    .where(
      and(
        eq(schema.eventPromptResponses.promptId, promptId),
        eq(schema.eventPromptResponses.userId, user.id),
      ),
    )
    .limit(1);
  if (!mine[0]) return { revealed: false as const, mine: null, theirs: null };

  const theirs = await db
    .select()
    .from(schema.eventPromptResponses)
    .where(
      and(
        eq(schema.eventPromptResponses.promptId, promptId),
        eq(schema.eventPromptResponses.userId, partnerUserId),
      ),
    )
    .limit(1);
  if (!theirs[0]) {
    return {
      revealed: false as const,
      mine: mine[0].response,
      theirs: null,
    };
  }
  return {
    revealed: true as const,
    mine: mine[0].response,
    theirs: theirs[0].response,
  };
}
