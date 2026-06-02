"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { rankCandidatesForUser } from "@/lib/matching/engine";

export async function runMatchingSnapshot(form: FormData) {
  const actor = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const mode = String(form.get("mode") ?? "normal");
  if (!userId) {
    redirect("/admin/matching");
  }

  const allUsers = await db
    .select({ user: schema.users })
    .from(schema.users);
  const candidates = allUsers
    .filter((u) => u.user.id !== userId && !u.user.banned)
    .map((u) => u.user.id);
  const ranking = await rankCandidatesForUser(userId, candidates);

  const [entry] = await db
    .insert(schema.auditLog)
    .values({
      actorUserId: actor.id,
      action: "admin.matching.snapshot",
      target: userId,
      diff: {
        mode,
        ranking,
      },
    })
    .returning();

  redirect(`/admin/matching?userId=${encodeURIComponent(userId)}&mode=${encodeURIComponent(mode)}&run=${entry.id}`);
}
