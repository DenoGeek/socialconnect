"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import {
  createInAppNotification,
  prefsAllow,
  notifyWarning,
} from "@/lib/notifications/in-app";
import { sendEmail } from "@/lib/notifications/email";

export async function warnUser(form: FormData) {
  const admin = await requireSuperAdminOrAdmin();
  const userId = String(form.get("userId"));
  const message = String(form.get("message") ?? "").trim();
  if (!message) throw new Error("Warning message required");

  const [target] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!target) throw new Error("User not found");

  await db
    .update(schema.users)
    .set({
      warningCount: sql`${schema.users.warningCount} + 1`,
      lastWarningAt: new Date(),
      lastWarningMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await notifyWarning({
    userId,
    email: target.email,
    message,
  });

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "user.warned",
    target: userId,
    diff: sql`${JSON.stringify({ message })}::jsonb`,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

async function requireSuperAdminOrAdmin() {
  const { requireRole } = await import("@/lib/auth");
  return requireRole(["admin", "super_admin"]);
}

export async function suspendUser(form: FormData) {
  const admin = await requireSuperAdminOrAdmin();
  const userId = String(form.get("userId"));
  const reason = String(form.get("reason") ?? "Suspended by admin").trim();

  await db
    .update(schema.users)
    .set({
      suspended: true,
      suspendedReason: reason,
      suspendedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await createInAppNotification({
    userId,
    kind: "warning",
    title: "Account suspended",
    body: `${reason} You can still log in, but events and matching are locked until staff lift the suspension.`,
    href: "/account",
  });

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "user.suspended",
    target: userId,
    diff: sql`${JSON.stringify({ reason })}::jsonb`,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function unsuspendUser(form: FormData) {
  const admin = await requireSuperAdminOrAdmin();
  const userId = String(form.get("userId"));
  await db
    .update(schema.users)
    .set({
      suspended: false,
      suspendedReason: null,
      suspendedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "user.unsuspended",
    target: userId,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function banUser(form: FormData) {
  const admin = await requireSuperAdminOrAdmin();
  const userId = String(form.get("userId"));
  const reason = String(form.get("reason") ?? "Banned by admin").trim();

  await db
    .update(schema.users)
    .set({
      banned: true,
      banReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "user.banned",
    target: userId,
    diff: sql`${JSON.stringify({ reason })}::jsonb`,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function unbanUser(form: FormData) {
  const admin = await requireSuperAdminOrAdmin();
  const userId = String(form.get("userId"));
  await db
    .update(schema.users)
    .set({
      banned: false,
      banReason: null,
      banExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await db.insert(schema.auditLog).values({
    actorUserId: admin.id,
    action: "user.unbanned",
    target: userId,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function sendAnnouncement(form: FormData) {
  const admin = await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const pathwayFilter = String(form.get("pathwayFilter") ?? "everyone");
  const cityFilter = String(form.get("cityFilter") ?? "").trim() || null;
  const eventIdFilter = String(form.get("eventIdFilter") ?? "").trim() || null;
  const sendEmailFlag = form.get("sendEmail") === "on";
  const sendInAppFlag = form.get("sendInApp") === "on";

  if (!title || !body) throw new Error("Title and body required");

  let recipients = await db
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.users.vettingStatus, "approved"));

  if (pathwayFilter === "amari" || pathwayFilter === "zahari") {
    recipients = recipients.filter((r) => r.user.pathway === pathwayFilter);
  }
  if (cityFilter) {
    recipients = recipients.filter(
      (r) => (r.profile?.city ?? "").toLowerCase() === cityFilter.toLowerCase(),
    );
  }
  if (eventIdFilter) {
    const tickets = await db
      .select({ userId: schema.ticketPurchases.userId })
      .from(schema.ticketPurchases)
      .where(
        and(
          eq(schema.ticketPurchases.eventId, eventIdFilter),
          inArray(schema.ticketPurchases.status, [
            "confirmed",
            "checked_in",
          ]),
        ),
      );
    const ids = new Set(tickets.map((t) => t.userId));
    recipients = recipients.filter((r) => ids.has(r.user.id));
  }

  // Respect community opt-out.
  const delivered: string[] = [];
  for (const r of recipients) {
    const allowCommunity = await prefsAllow(r.user.id, "community");
    if (!allowCommunity) continue;
    delivered.push(r.user.id);

    if (sendInAppFlag) {
      await createInAppNotification({
        userId: r.user.id,
        kind: "announcement",
        title,
        body,
        href: "/notifications",
      });
    }
    if (sendEmailFlag && (await prefsAllow(r.user.id, "email"))) {
      await sendEmail({
        to: r.user.email,
        subject: title,
        html: `<div style="font-family:Georgia,serif"><h1>${title}</h1><p>${body}</p></div>`,
      });
    }
  }

  await db.insert(schema.announcements).values({
    authorUserId: admin.id,
    title,
    body,
    pathwayFilter,
    cityFilter,
    eventIdFilter,
    sendEmail: sendEmailFlag,
    sendInApp: sendInAppFlag,
    recipientCount: delivered.length,
  });

  revalidatePath("/admin/announcements");
}

export async function reviewModerationItem(form: FormData) {
  const admin = await requireAdmin();
  const itemId = String(form.get("itemId"));
  const decision = String(form.get("decision")); // approved | rejected
  const notes = String(form.get("reviewNotes") ?? "").trim();

  const [item] = await db
    .select()
    .from(schema.moderationItems)
    .where(eq(schema.moderationItems.id, itemId))
    .limit(1);
  if (!item) throw new Error("Item not found");

  await db
    .update(schema.moderationItems)
    .set({
      status: decision === "approved" ? "approved" : "rejected",
      reviewNotes: notes || null,
      reviewedByUserId: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(schema.moderationItems.id, itemId));

  if (item.kind === "profile" || item.kind === "bio" || item.kind === "photo") {
    await db
      .update(schema.profiles)
      .set({
        moderationStatus: decision === "approved" ? "approved" : "rejected",
        flaggedForReview: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, item.userId));
  }

  revalidatePath("/admin/moderation");
}

export async function resolveReport(form: FormData) {
  await requireAdmin();
  const reportId = String(form.get("reportId"));
  await db
    .update(schema.userReports)
    .set({ resolvedAt: new Date() })
    .where(eq(schema.userReports.id, reportId));
  revalidatePath("/admin/flags");
}

export async function resolvePanic(form: FormData) {
  const admin = await requireAdmin();
  const alertId = String(form.get("alertId"));
  await db
    .update(schema.panicAlerts)
    .set({ resolvedAt: new Date(), resolvedByUserId: admin.id })
    .where(eq(schema.panicAlerts.id, alertId));
  revalidatePath("/admin/flags");
}
