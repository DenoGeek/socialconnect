"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function sendMessage(form: FormData) {
  const user = await requireUser();
  const threadId = String(form.get("threadId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;

  await db.insert(schema.conciergeMessages).values({
    threadId,
    senderUserId: user.id,
    body,
    priority: user.tier === "elite" ? "high" : "normal",
  });

  revalidatePath("/concierge/thread");
}
