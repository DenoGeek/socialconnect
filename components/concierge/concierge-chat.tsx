"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { sendMessage } from "@/app/(app)/concierge/thread/actions";

type Message = {
  id: string;
  senderUserId: string;
  body: string;
  priority: string;
  attachments: { name: string; ephemeral?: boolean }[];
  createdAt: string;
};

export function ConciergeChat({
  threadId,
  userId,
  initialMessages,
  conciergeOnDuty,
  elite,
}: {
  threadId: string;
  userId: string;
  initialMessages: Message[];
  conciergeOnDuty: boolean;
  elite: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/concierge/${threadId}/messages`);
        if (res.ok) {
          const data = (await res.json()) as { messages: Message[] };
          setMessages(data.messages);
        }
      } catch {
        // ignore poll errors
      }
    }, 10000);
    return () => clearInterval(poll);
  }, [threadId]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("threadId", threadId);
    fd.set("body", body.trim());
    start(async () => {
      await sendMessage(fd);
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className={`flex flex-col ${elite ? "min-h-[60vh]" : "min-h-[50vh]"}`}>
      <div className="flex items-center gap-2 mb-3">
        {conciergeOnDuty ? (
          <Badge tone="mint">On duty</Badge>
        ) : (
          <Badge tone="neutral">Replies within 24h</Badge>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto space-y-3 rounded-2xl p-3 mb-4 ${
          elite ? "bg-black/20 border border-[#d4af37]/15" : "bg-plum-50"
        }`}
      >
        {messages.length === 0 && (
          <Card>
            <CardTitle className="text-base">
              Your matchmaker is ready
            </CardTitle>
          </Card>
        )}
        {messages.map((m) => {
          const mine = m.senderUserId === userId;
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
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Message your matchmaker…"
          required
        />
        <div className="flex justify-end">
          <Button type="submit" variant={elite ? "elite" : "primary"} disabled={pending}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
