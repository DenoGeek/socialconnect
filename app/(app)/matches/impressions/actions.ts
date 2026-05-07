"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  aliasAssignments,
  events,
  impressions,
  ticketPurchases,
} from "@/db/schema";
import { requireSession } from "@/lib/auth/server";
import { inngest } from "@/inngest/client";

const submitSchema = z.object({
  whatILiked: z.string().max(500).optional(),
  dreamDate: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

export interface SubmitImpressionInput {
  eventSlug: string;
  aliasId: string;
}

/**
 * Records an impression from the current user toward another attendee
 * (identified by their per-event alias) and fires `impression.submitted`
 * so Inngest can detect a mutual match.
 *
 * Privacy: the request never includes the target's user ID. We resolve it
 * server-side from `aliasAssignments(eventId, aliasId)`.
 */
export async function submitImpression(
  input: SubmitImpressionInput,
  formData: FormData,
): Promise<void> {
  const session = await requireSession();
  const fromUserId = session.user.id;

  const parsed = submitSchema.parse({
    whatILiked: (formData.get("whatILiked") as string) || undefined,
    dreamDate: (formData.get("dreamDate") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  const [event] = await db.select().from(events).where(eq(events.slug, input.eventSlug)).limit(1);
  if (!event) throw new Error("Event not found.");

  // Confirm the submitter actually attended.
  const [own] = await db
    .select()
    .from(ticketPurchases)
    .where(
      and(
        eq(ticketPurchases.userId, fromUserId),
        eq(ticketPurchases.eventId, event.id),
        inArray(ticketPurchases.status, ["paid", "checked_in"] as const),
      ),
    )
    .limit(1);
  if (!own) throw new Error("You can only leave impressions for events you attended.");

  // Resolve the alias → attendee user.
  const [target] = await db
    .select()
    .from(aliasAssignments)
    .where(
      and(eq(aliasAssignments.eventId, event.id), eq(aliasAssignments.aliasId, input.aliasId)),
    )
    .limit(1);
  if (!target) throw new Error("Alias not found for this event.");
  if (target.userId === fromUserId) {
    throw new Error("You can't leave an impression about yourself.");
  }

  // Insert the impression. Unique index on (eventId, fromUserId, toUserId)
  // prevents duplicates — DO NOTHING handles re-submits.
  const [row] = await db
    .insert(impressions)
    .values({
      eventId: event.id,
      fromUserId,
      toUserId: target.userId,
      whatILiked: parsed.whatILiked,
      dreamDate: parsed.dreamDate,
      notes: parsed.notes,
    })
    .onConflictDoNothing({
      target: [impressions.eventId, impressions.fromUserId, impressions.toUserId],
    })
    .returning();

  if (row) {
    await inngest.send({
      name: "impression.submitted",
      data: {
        eventId: event.id,
        fromUserId,
        toUserId: target.userId,
        impressionId: row.id,
      },
    });
  }

  revalidatePath(`/matches/impressions/${event.slug}`);
  revalidatePath("/matches");
  redirect(`/matches/impressions/${event.slug}?just=${encodeURIComponent(input.aliasId)}`);
}
