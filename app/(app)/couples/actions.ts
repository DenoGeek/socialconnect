"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function requestCouplesCommunityAccess(form: FormData) {
  const user = await requireUser();
  const partnerUserId = String(form.get("partnerUserId") ?? "").trim() || null;

  const [existing] = await db
    .select()
    .from(schema.couplesCommunityMembers)
    .where(eq(schema.couplesCommunityMembers.userId, user.id))
    .limit(1);

  if (existing) {
    revalidatePath("/couples");
    return;
  }

  await db.insert(schema.couplesCommunityMembers).values({
    userId: user.id,
    partnerUserId,
    status: "pending",
  });

  revalidatePath("/couples");
  revalidatePath("/admin/couples");
}

export async function postCouplesMessage(form: FormData) {
  const user = await requireUser();
  const body = String(form.get("body") ?? "").trim();
  if (!body) throw new Error("Message required");

  const [member] = await db
    .select()
    .from(schema.couplesCommunityMembers)
    .where(
      and(
        eq(schema.couplesCommunityMembers.userId, user.id),
        eq(schema.couplesCommunityMembers.status, "approved"),
      ),
    )
    .limit(1);
  if (!member) throw new Error("Couples community access required");

  await db.insert(schema.couplesCommunityPosts).values({
    authorUserId: user.id,
    body,
  });

  revalidatePath("/couples");
}

export async function vetCouplesMember(form: FormData) {
  const admin = await requireAdmin();
  const memberId = String(form.get("memberId"));
  const decision = String(form.get("decision")); // approved | rejected

  await db
    .update(schema.couplesCommunityMembers)
    .set({
      status: decision === "approved" ? "approved" : "rejected",
      vettedAt: new Date(),
      vettedByUserId: admin.id,
    })
    .where(eq(schema.couplesCommunityMembers.id, memberId));

  revalidatePath("/admin/couples");
  revalidatePath("/couples");
}
