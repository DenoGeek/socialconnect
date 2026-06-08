import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser, isStaffRole } from "@/lib/auth";
import { countPendingForStaff } from "@/lib/concierge/unread";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await db
    .select({
      thread: schema.conciergeThreads,
      member: schema.users,
    })
    .from(schema.conciergeThreads)
    .innerJoin(schema.users, eq(schema.users.id, schema.conciergeThreads.userId));

  const enriched = await Promise.all(
    threads.map(async ({ thread, member }) => {
      const messages = await db
        .select()
        .from(schema.conciergeMessages)
        .where(eq(schema.conciergeMessages.threadId, thread.id))
        .orderBy(asc(schema.conciergeMessages.createdAt));

      const unreadCount = countPendingForStaff(messages, member.id);
      const last = messages[messages.length - 1];

      return {
        threadId: thread.id,
        memberUserId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        pathway: member.pathway,
        tier: member.tier,
        conciergeOnDuty: thread.conciergeOnDuty,
        unreadCount,
        lastMessageBody: last?.body ?? null,
        lastMessageAt: last?.createdAt.toISOString() ?? null,
        messages: messages.map((m) => ({
          id: m.id,
          senderUserId: m.senderUserId,
          body: m.body,
          priority: m.priority,
          attachments: m.attachments,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    }),
  );

  enriched.sort(
    (a, b) => b.unreadCount - a.unreadCount || (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
  );

  return NextResponse.json({ threads: enriched });
}
