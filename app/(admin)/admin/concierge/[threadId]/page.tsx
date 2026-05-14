import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { conciergeReply } from "./actions";

export default async function ConciergeThreadAdmin({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const me = await requireAdmin();
  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.id, threadId))
    .limit(1);
  if (!thread) notFound();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, thread.userId))
    .limit(1);

  const messages = await db
    .select()
    .from(schema.conciergeMessages)
    .where(eq(schema.conciergeMessages.threadId, thread.id))
    .orderBy(asc(schema.conciergeMessages.createdAt));

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          {user?.name} {user?.tier === "elite" && <Badge tone="amber">Elite</Badge>}
        </h1>
        <p className="text-sm text-plum-900/60">{user?.email}</p>
      </header>

      <div className="space-y-3">
        {messages.map((m) => {
          const mine = m.senderUserId === me.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-2xl p-3 text-sm ${
                  mine
                    ? "bg-plum-900 text-plum-100"
                    : "bg-white border border-plum-900/10 text-plum-900"
                }`}
              >
                {m.priority !== "normal" && (
                  <Badge tone="amber">{m.priority}</Badge>
                )}
                <p className="whitespace-pre-line mt-1">{m.body}</p>
                <p className="text-[10px] opacity-50 mt-1">
                  {new Date(m.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardTitle>Reply</CardTitle>
        <form action={conciergeReply} className="mt-3 space-y-2">
          <input type="hidden" name="threadId" value={thread.id} />
          <Textarea name="body" rows={4} required />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}
