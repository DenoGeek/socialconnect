import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isEliteExperience, isStaffRole } from "@/lib/auth";
import { MemberConciergeFloater } from "./member-concierge-floater";

export async function MemberConciergeFloaterShell({
  user,
}: {
  user: {
    id: string;
    pathway: string | null;
    tier: string | null;
    role: string;
  };
}) {
  if (isStaffRole(user.role) || !isEliteExperience(user)) return null;

  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.userId, user.id))
    .limit(1);

  if (!thread) return null;

  const messages = await db
    .select()
    .from(schema.conciergeMessages)
    .where(eq(schema.conciergeMessages.threadId, thread.id))
    .orderBy(asc(schema.conciergeMessages.createdAt));

  let matchmakerName = "Evermore Concierge";
  if (user.pathway === "zahari") {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, user.id))
      .limit(1);
    if (eng?.matchmakerUserId) {
      const [mm] = await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, eng.matchmakerUserId))
        .limit(1);
      if (mm?.name) matchmakerName = mm.name;
    }
  }

  return (
    <MemberConciergeFloater
      threadId={thread.id}
      userId={user.id}
      initialMessages={messages.map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        body: m.body,
        priority: m.priority,
        attachments: m.attachments,
        createdAt: m.createdAt.toISOString(),
      }))}
      conciergeOnDuty={thread.conciergeOnDuty}
      matchmakerName={matchmakerName}
    />
  );
}
