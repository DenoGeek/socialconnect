"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function conciergeReply(form: FormData) {
  const me = await requireAdmin();
  const threadId = String(form.get("threadId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  await db.insert(schema.conciergeMessages).values({
    threadId,
    senderUserId: me.id,
    body,
    priority: "normal",
  });
  revalidatePath(`/admin/concierge/${threadId}`);
}
