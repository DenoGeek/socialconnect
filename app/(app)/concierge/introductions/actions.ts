"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function respondToIntroduction(form: FormData) {
  const user = await requireUser();
  const introId = String(form.get("introId"));
  const response = String(form.get("response"));

  const rows = await db
    .select({
      intro: schema.zahariIntroductions,
      eng: schema.zahariEngagements,
    })
    .from(schema.zahariIntroductions)
    .innerJoin(
      schema.zahariEngagements,
      eq(schema.zahariEngagements.id, schema.zahariIntroductions.engagementId),
    )
    .where(eq(schema.zahariIntroductions.id, introId))
    .limit(1);

  const row = rows[0];
  if (!row || row.eng.userId !== user.id) {
    throw new Error("Introduction not found");
  }

  if (response === "accepted") {
    await db
      .update(schema.zahariIntroductions)
      .set({
        status: "accepted",
        clientResponse: "accepted",
        respondedAt: new Date(),
      })
      .where(eq(schema.zahariIntroductions.id, introId));
  } else if (response === "declined") {
    await db
      .update(schema.zahariIntroductions)
      .set({
        status: "declined",
        clientResponse: "declined",
        respondedAt: new Date(),
      })
      .where(eq(schema.zahariIntroductions.id, introId));
  } else if (response === "feedback") {
    await db
      .update(schema.zahariIntroductions)
      .set({
        status: "completed",
        feedback: String(form.get("feedback") ?? ""),
        respondedAt: new Date(),
      })
      .where(eq(schema.zahariIntroductions.id, introId));
  }

  revalidatePath("/concierge/introductions");
}
