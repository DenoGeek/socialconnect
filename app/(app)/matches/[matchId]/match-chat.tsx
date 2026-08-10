"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendMatchMessage } from "./actions";

export function MatchChat({
  matchId,
  messages,
  currentUserId,
}: {
  matchId: string;
  currentUserId: string;
  messages: Array<{
    id: string;
    body: string;
    senderUserId: string;
    createdAt: Date | string;
  }>;
}) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("body", body);
    start(async () => {
      try {
        await sendMatchMessage(fd);
        setBody("");
      } catch (error) {
        setErr(error instanceof Error ? error.message : "Could not send");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-plum-900/8 bg-plum-900/[0.02] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-plum-900/50">
            You chose each other after the event. Profiles are open — start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderUserId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-plum-900 text-plum-100"
                    : "bg-white border border-plum-900/10 text-plum-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? "text-plum-100/60" : "text-plum-900/40"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-2xl border px-3 py-2 text-sm"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !body.trim()}>
          Send
        </Button>
      </form>
      {err && <p className="text-sm text-amber-700">{err}</p>}
    </div>
  );
}
