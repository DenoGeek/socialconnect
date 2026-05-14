"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function createSyncInvite(form: FormData) {
  const user = await requireUser();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email required");

  const token = randomBytes(20).toString("hex");
  await db.insert(schema.duoSyncs).values({
    initiatorUserId: user.id,
    inviteeEmail: email,
    inviteToken: token,
    status: "invited",
  });
  revalidatePath("/duo");
}

export async function acceptSync(form: FormData) {
  const user = await requireUser();
  const token = String(form.get("token"));
  const [row] = await db
    .select()
    .from(schema.duoSyncs)
    .where(eq(schema.duoSyncs.inviteToken, token))
    .limit(1);
  if (!row) throw new Error("Invite not found");
  if (row.status !== "invited") throw new Error("Invite no longer active");

  await db
    .update(schema.duoSyncs)
    .set({
      inviteeUserId: user.id,
      status: "active",
      acceptedAt: new Date(),
    })
    .where(eq(schema.duoSyncs.id, row.id));

  // Flip both users into couple mode.
  await db
    .update(schema.users)
    .set({ mode: "couple" })
    .where(eq(schema.users.id, row.initiatorUserId));
  await db
    .update(schema.users)
    .set({ mode: "couple" })
    .where(eq(schema.users.id, user.id));

  revalidatePath("/duo");
}

export async function desync(form: FormData) {
  const user = await requireUser();
  const duoId = String(form.get("duoId"));
  const [row] = await db
    .select()
    .from(schema.duoSyncs)
    .where(eq(schema.duoSyncs.id, duoId))
    .limit(1);
  if (!row) return;
  if (row.initiatorUserId !== user.id && row.inviteeUserId !== user.id) {
    throw new Error("Not your sync");
  }

  await db
    .update(schema.duoSyncs)
    .set({ status: "desynced", desyncedAt: new Date() })
    .where(eq(schema.duoSyncs.id, duoId));

  // Exclude the pair from future matches automatically (clean break).
  if (row.inviteeUserId) {
    await db
      .insert(schema.matchExclusions)
      .values({
        userAId: row.initiatorUserId,
        userBId: row.inviteeUserId,
        reason: "duo desynced",
      })
      .onConflictDoNothing();
    await db
      .insert(schema.matchExclusions)
      .values({
        userAId: row.inviteeUserId,
        userBId: row.initiatorUserId,
        reason: "duo desynced",
      })
      .onConflictDoNothing();
  }

  revalidatePath("/duo");
}
