"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, conciergeIntakes } from "@/db/schema";
import { requireRole } from "@/lib/auth/server";

const reviewSchema = z.object({
  status: z.enum(["in_review", "approved", "declined", "matched", "archived"]),
  privateNotes: z.string().max(4000).optional(),
});

export async function reviewIntake(intakeId: string, formData: FormData) {
  const session = await requireRole(["admin", "concierge"]);
  const parsed = reviewSchema.parse({
    status: formData.get("status"),
    privateNotes: (formData.get("privateNotes") as string) || undefined,
  });

  await db
    .update(conciergeIntakes)
    .set({
      status: parsed.status,
      privateNotes: parsed.privateNotes,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(conciergeIntakes.id, intakeId));

  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: `intake.${parsed.status}`,
    resourceType: "concierge_intake",
    resourceId: intakeId,
  });

  revalidatePath("/admin/concierge/intakes");
  revalidatePath(`/admin/concierge/intakes/${intakeId}`);
  redirect(`/admin/concierge/intakes/${intakeId}?saved=1`);
}
