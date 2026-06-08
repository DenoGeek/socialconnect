"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function approveApplication(form: FormData) {
  const admin = await requireAdmin();
  const applicationId = String(form.get("applicationId"));
  const matchmakerUserId = (form.get("matchmakerUserId") as string) || undefined;

  const [app] = await db
    .select()
    .from(schema.memberApplications)
    .where(eq(schema.memberApplications.id, applicationId))
    .limit(1);
  if (!app) throw new Error("Application not found");

  await db
    .update(schema.memberApplications)
    .set({
      status: "approved",
      reviewedByUserId: admin.id,
      reviewNotes: (form.get("reviewNotes") as string) || undefined,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.memberApplications.id, applicationId));

  await db
    .update(schema.users)
    .set({
      pathway: app.pathway,
      vettingStatus: "approved",
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, app.userId));

  if (app.pathway === "zahari") {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, app.userId))
      .limit(1);
    if (!eng) {
      await db.insert(schema.zahariEngagements).values({
        userId: app.userId,
        matchmakerUserId: matchmakerUserId ?? admin.id,
      });
    } else if (matchmakerUserId) {
      await db
        .update(schema.zahariEngagements)
        .set({ matchmakerUserId, updatedAt: new Date() })
        .where(eq(schema.zahariEngagements.userId, app.userId));
    }
    const [thread] = await db
      .select()
      .from(schema.conciergeThreads)
      .where(eq(schema.conciergeThreads.userId, app.userId))
      .limit(1);
    if (!thread) {
      await db.insert(schema.conciergeThreads).values({
        userId: app.userId,
        assignedConciergeId: matchmakerUserId ?? admin.id,
      });
    }

    const [userRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, app.userId))
      .limit(1);
    const [existingProfile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, app.userId))
      .limit(1);
    const profileValues = {
      displayName: userRow?.name ?? "Member",
      city: app.city ?? undefined,
      bio: app.professionalContext ?? undefined,
      isPublic: false,
      silentMode: true,
      onboardingProgress: 99,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    };
    if (existingProfile) {
      await db
        .update(schema.profiles)
        .set(profileValues)
        .where(eq(schema.profiles.userId, app.userId));
    } else {
      await db.insert(schema.profiles).values({
        userId: app.userId,
        ...profileValues,
      });
    }
  }

  if (app.optIntoCandidatePool && app.pathway === "amari") {
    const [pool] = await db
      .select()
      .from(schema.candidatePoolMembers)
      .where(eq(schema.candidatePoolMembers.userId, app.userId))
      .limit(1);
    if (!pool) {
      await db.insert(schema.candidatePoolMembers).values({ userId: app.userId });
    }
  }

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "application.approved",
    target: app.userId,
    diff: sql`${JSON.stringify({ applicationId, pathway: app.pathway })}::jsonb`,
  });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/users/${app.userId}`);
}

export async function rejectApplication(form: FormData) {
  const admin = await requireAdmin();
  const applicationId = String(form.get("applicationId"));
  const reason = String(form.get("rejectionReason") ?? "Not accepted at this time");

  const [app] = await db
    .select()
    .from(schema.memberApplications)
    .where(eq(schema.memberApplications.id, applicationId))
    .limit(1);
  if (!app) throw new Error("Application not found");

  await db
    .update(schema.memberApplications)
    .set({
      status: "rejected",
      reviewedByUserId: admin.id,
      rejectionReason: reason,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.memberApplications.id, applicationId));

  await db
    .update(schema.users)
    .set({ vettingStatus: "rejected", updatedAt: new Date() })
    .where(eq(schema.users.id, app.userId));

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "application.rejected",
    target: app.userId,
    diff: sql`${JSON.stringify({ applicationId, reason })}::jsonb`,
  });

  revalidatePath("/admin/applications");
}

export async function markInReview(form: FormData) {
  await requireAdmin();
  const applicationId = String(form.get("applicationId"));
  await db
    .update(schema.memberApplications)
    .set({ status: "in_review", updatedAt: new Date() })
    .where(eq(schema.memberApplications.id, applicationId));
  revalidatePath("/admin/applications");
}
