import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.id, threadId))
    .limit(1);

  if (!thread || thread.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await db
    .select()
    .from(schema.conciergeMessages)
    .where(eq(schema.conciergeMessages.threadId, threadId))
    .orderBy(asc(schema.conciergeMessages.createdAt));

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      priority: m.priority,
      attachments: m.attachments,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
