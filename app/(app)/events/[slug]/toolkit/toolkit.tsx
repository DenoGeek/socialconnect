"use client";

import { useState, useTransition } from "react";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  submitBlindResponse,
  saveInteractionNote,
  getBlindReveal,
} from "./actions";

type Prompt = { id: string; kind: string; prompt: string };

export function Toolkit({
  event,
  prompts,
  myAlias,
  aliases,
  existingResponses,
  existingNotes,
}: {
  event: { id: string; title: string; slug: string };
  prompts: Prompt[];
  myAlias: string | null;
  aliases: { id: string; name: string }[];
  existingResponses: { promptId: string; response: string }[];
  existingNotes: { id: string; subjectAliasId: string; body: string }[];
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-plum-900/50 uppercase tracking-widest">
          Live event toolkit
        </p>
        <h1 className="text-display text-3xl text-plum-900">{event.title}</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          You are <span className="font-medium">{myAlias ?? "Unassigned"}</span> here.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-display text-2xl text-plum-900">Icebreakers</h2>
        {prompts
          .filter((p) => p.kind === "icebreaker" || p.kind === "game")
          .map((p) => (
            <Card key={p.id}>
              <CardTitle>{p.prompt}</CardTitle>
              <CardSubtitle>
                Conversation starter — try it with someone at your table.
              </CardSubtitle>
            </Card>
          ))}
      </section>

      <section className="grid gap-4">
        <h2 className="text-display text-2xl text-plum-900">Blind responses</h2>
        <p className="text-sm text-plum-900/60">
          Type your answer. You&rsquo;ll see your partner&rsquo;s only once you both
          submit.
        </p>
        {prompts
          .filter((p) => p.kind === "blind_response")
          .map((p) => (
            <BlindResponseRow
              key={p.id}
              prompt={p}
              aliases={aliases}
              existing={
                existingResponses.find((r) => r.promptId === p.id)?.response ??
                ""
              }
            />
          ))}
      </section>

      <section className="grid gap-4">
        <h2 className="text-display text-2xl text-plum-900">
          Digital interaction log
        </h2>
        <p className="text-sm text-plum-900/60">
          Private to you. Tap an alias and jot a quick impression for later
          review.
        </p>
        <NoteForm eventId={event.id} aliases={aliases} />
        <div className="grid gap-3">
          {existingNotes.map((n) => (
            <Card key={n.id} className="bg-plum-900/3">
              <Badge tone="neutral">
                {aliases.find((a) => a.id === n.subjectAliasId)?.name ?? "Alias"}
              </Badge>
              <p className="mt-2 text-sm text-plum-900/80 whitespace-pre-line">
                {n.body}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function BlindResponseRow({
  prompt,
  aliases,
  existing,
}: {
  prompt: Prompt;
  aliases: { id: string; name: string }[];
  existing: string;
}) {
  const [partner, setPartner] = useState<string>("");
  const [text, setText] = useState(existing);
  const [reveal, setReveal] = useState<{
    revealed: boolean;
    mine: string | null;
    theirs: string | null;
  } | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!partner) {
      setErr("Pick the alias you're responding with");
      return;
    }
    setErr(null);
    const fd = new FormData();
    fd.set("promptId", prompt.id);
    fd.set("partnerUserId", partner);
    fd.set("response", text);
    start(async () => {
      await submitBlindResponse(fd);
      const r = await getBlindReveal(prompt.id, partner);
      setReveal(r);
    });
  }

  return (
    <Card>
      <CardTitle>{prompt.prompt}</CardTitle>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <select
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
          className="w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">Pair with…</option>
          {aliases.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your response (hidden until both submit)"
        />
        {err && <Alert tone="danger">{err}</Alert>}
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
      </form>
      {reveal && !reveal.revealed && (
        <Alert tone="info" className="mt-3">
          You&rsquo;re in. Waiting on your partner&rsquo;s response.
        </Alert>
      )}
      {reveal && reveal.revealed && (
        <div className="mt-3 rounded-2xl bg-plum-900/5 p-4 text-sm space-y-2">
          <p>
            <strong>You:</strong> {reveal.mine}
          </p>
          <p>
            <strong>Them:</strong> {reveal.theirs}
          </p>
        </div>
      )}
    </Card>
  );
}

function NoteForm({
  eventId,
  aliases,
}: {
  eventId: string;
  aliases: { id: string; name: string }[];
}) {
  return (
    <form action={saveInteractionNote} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <select
        name="subjectAliasId"
        required
        className="w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2.5 text-sm"
      >
        <option value="">Who is this about?</option>
        {aliases.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Textarea name="body" placeholder="Notes only you can see…" required />
      <Button type="submit">Save note</Button>
    </form>
  );
}
