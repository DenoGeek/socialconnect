"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, isEliteExperience, isStaffRole } from "@/lib/auth";

export async function sendMessage(form: FormData) {
  const user = await requireUser();
  const threadId = String(form.get("threadId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;

  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.id, threadId))
    .limit(1);
  if (!thread) throw new Error("Thread not found.");

  const isMember = thread.userId === user.id;
  const isStaff = isStaffRole(user.role);
  if (!isMember && !isStaff) throw new Error("Not allowed.");

  await db.insert(schema.conciergeMessages).values({
    threadId,
    senderUserId: user.id,
    body,
    priority:
      isMember && isEliteExperience(user) ? "high" : "normal",
  });

  revalidatePath("/concierge/thread");
  revalidatePath("/concierge");
  revalidatePath(`/admin/concierge/${threadId}`);
  revalidatePath("/admin/concierge");
}
