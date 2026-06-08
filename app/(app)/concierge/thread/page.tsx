import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, isEliteExperience } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { sendMessage } from "./actions";

export default async function ThreadPage() {
  const user = await requireUser();

  if (user.pathway === "zahari") {
    redirect("/concierge");
  }

  let [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.userId, user.id))
    .limit(1);
  if (!thread) {
    [thread] = await db
      .insert(schema.conciergeThreads)
      .values({ userId: user.id })
      .returning();
  }

  const messages = await db
    .select()
    .from(schema.conciergeMessages)
    .where(eq(schema.conciergeMessages.threadId, thread.id))
    .orderBy(asc(schema.conciergeMessages.createdAt));

  const elite = isEliteExperience(user);

  return (
    <div className={`max-w-2xl space-y-6 ${elite ? "elite-bg p-4 rounded-3xl" : ""}`}>
      <header className={elite ? "elite-page-header" : ""}>
        <h1 className="text-display text-3xl">Concierge thread</h1>
        <p className="text-sm opacity-70">
          Encrypted at rest. Only you and the Concierge see this.
        </p>
        {thread.conciergeOnDuty && (
          <Badge tone="mint" className="mt-2">
            On duty
          </Badge>
        )}
      </header>

      <div className="space-y-3">
        {messages.map((m) => {
          const mine = m.senderUserId === user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-2xl p-3 text-sm ${
                  mine
                    ? "bg-plum-900 text-plum-100"
                    : elite
                      ? "bg-white/10 border border-[#d4af37]/20 text-plum-100"
                      : "bg-white border border-plum-900/10 text-plum-900"
                }`}
              >
                {m.priority === "urgent" && (
                  <Badge tone="amber" className="mb-1">
                    Urgent
                  </Badge>
                )}
                <p className="whitespace-pre-line">{m.body}</p>
                {m.attachments.length > 0 && (
                  <ul className="mt-2 text-xs opacity-80">
                    {m.attachments.map((a, i) => (
                      <li key={i}>
                        📎 {a.name} {a.ephemeral && "(ephemeral)"}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] opacity-50 mt-1">
                  {new Date(m.createdAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <Card>
            <CardTitle>Start the conversation</CardTitle>
          </Card>
        )}
      </div>

      <form
        action={sendMessage}
        className={`space-y-2 ${elite ? "elite-page-header" : ""}`}
      >
        <input type="hidden" name="threadId" value={thread.id} />
        <Textarea name="body" rows={3} placeholder="Send a message…" required />
        <div className="flex justify-between items-center gap-2">
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" name="ephemeral" value="1" />
            Ephemeral attachment
          </label>
          <Button type="submit" variant={elite ? "elite" : "primary"}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
