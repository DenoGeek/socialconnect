"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { conciergeIntakes } from "@/db/schema";
import { requireSession } from "@/lib/auth/server";

const schema = z.object({
  ageRange: z.string().min(1).max(50),
  city: z.string().min(2).max(100),
  lookingFor: z.string().min(20).max(2000),
  dealbreakers: z.string().max(2000).optional(),
  privacy: z.string().max(2000).optional(),
  budgetKes: z.coerce.number().int().min(0).optional(),
  timeline: z.string().max(200).optional(),
});

export async function submitIntake(formData: FormData) {
  const session = await requireSession();

  const parsed = schema.parse({
    ageRange: formData.get("ageRange"),
    city: formData.get("city"),
    lookingFor: formData.get("lookingFor"),
    dealbreakers: (formData.get("dealbreakers") as string) || undefined,
    privacy: (formData.get("privacy") as string) || undefined,
    budgetKes: formData.get("budgetKes") || undefined,
    timeline: (formData.get("timeline") as string) || undefined,
  });

  // One active intake per user — overwrite if it exists, else insert.
  const existing = (
    await db
      .select()
      .from(conciergeIntakes)
      .where(eq(conciergeIntakes.userId, session.user.id))
      .limit(1)
  )[0];

  const requirements = {
    ageRange: parsed.ageRange,
    city: parsed.city,
    lookingFor: parsed.lookingFor,
    dealbreakers: parsed.dealbreakers,
    privacy: parsed.privacy,
  };

  if (existing) {
    await db
      .update(conciergeIntakes)
      .set({
        status: "submitted",
        requirements,
        budgetKes: parsed.budgetKes,
        timeline: parsed.timeline,
        updatedAt: new Date(),
      })
      .where(eq(conciergeIntakes.id, existing.id));
  } else {
    await db.insert(conciergeIntakes).values({
      userId: session.user.id,
      status: "submitted",
      requirements,
      budgetKes: parsed.budgetKes,
      timeline: parsed.timeline,
    });
  }

  revalidatePath("/concierge");
  revalidatePath("/concierge/intake");
  redirect("/concierge?submitted=1");
}
