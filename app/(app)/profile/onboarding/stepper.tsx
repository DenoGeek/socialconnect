"use client";

import { useMemo, useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { INTENT_BADGES, detectContradictions } from "@/lib/intent/badges";
import { CHRISTIAN_DEAL_BREAKERS } from "@/lib/profile/deal-breakers";
import { suggestDisplayNames } from "@/lib/profile/display-names";
import { saveStep } from "./actions";

type Question = {
  id: string;
  step: number;
  prompt: string;
  questionType: string;
  options: string[] | null;
  category: string | null;
};

type Profile = {
  displayName: string;
  phone: string;
  city: string;
  bio: string;
  dreamDate: string;
  intentBadges: string[];
  dealBreakers: string[];
  interests: string[];
  theologicalAlignment: string[];
};

const THEOLOGICAL = [
  "Christian — Pentecostal",
  "Christian — Catholic",
  "Christian — Evangelical",
  "Christian — Orthodox",
  "Christian — Other",
];

const COMMON_INTERESTS = [
  "Nature & quiet",
  "Hiking",
  "Cooking",
  "Travel",
  "Books",
  "Fitness",
  "Music",
  "Faith life",
  "Service / volunteering",
  "Entrepreneurship",
];

export function OnboardingStepper({
  questions,
  existingResponses,
  startAtStep,
  profile,
}: {
  questions: Question[];
  existingResponses: Array<{ questionId: string; answer: unknown }>;
  startAtStep: number;
  profile: Profile;
}) {
  // Sections:
  // 0: Basics, 1: Intent badges, 2: Interests, 3: Theological,
  // 4: Deal breakers, 5+: psychometric questions, last: review & finalize.
  const sections = [
    "basics",
    "intent",
    "interests",
    "theological",
    "dealbreakers",
    ...questions.map((q) => `q:${q.id}`),
    "review",
  ];
  const totalSteps = sections.length;
  const [step, setStep] = useState(Math.min(startAtStep, totalSteps - 1));
  const [data, setData] = useState({
    ...profile,
    spendingTier: "standard",
    answers: Object.fromEntries(
      existingResponses.map((r) => [r.questionId, r.answer]),
    ) as Record<string, unknown>,
  });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const contradictions = detectContradictions(data.intentBadges);
  const nameSuggestions = useMemo(
    () => suggestDisplayNames(data.displayName || profile.displayName, 8),
    [data.displayName, profile.displayName],
  );

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function persist(opts: { finalize?: boolean; toStep?: number } = {}) {
    setErr(null);
    const fd = new FormData();
    fd.set("step", String(opts.toStep ?? step));
    fd.set("totalSteps", String(totalSteps));
    if (opts.finalize) fd.set("finalize", "1");
    fd.set("displayName", data.displayName);
    fd.set("phone", data.phone);
    fd.set("city", data.city);
    fd.set("bio", data.bio);
    fd.set("dreamDate", data.dreamDate);
    fd.set("spendingTier", data.spendingTier);
    fd.set("intentBadges", JSON.stringify(data.intentBadges));
    fd.set("dealBreakers", JSON.stringify(data.dealBreakers));
    fd.set("interests", JSON.stringify(data.interests));
    fd.set(
      "theologicalAlignment",
      JSON.stringify(data.theologicalAlignment),
    );
    const answersToSave = Object.entries(data.answers).map(
      ([questionId, answer]) => ({ questionId, answer }),
    );
    fd.set("answers", JSON.stringify(answersToSave));
    start(async () => {
      try {
        const result = await saveStep(fd);
        if (result.finalized) {
          window.location.assign("/profile?onboarded=1");
        }
      } catch (e: unknown) {
        if (isRedirectError(e)) return;
        setErr((e as Error).message ?? "Could not save.");
      }
    });
  }

  function next() {
    persist({ toStep: step + 1 });
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const currentSection = sections[step];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-plum-900/50 uppercase tracking-widest mb-1">
          Psychometric onboarding · {step + 1} of {totalSteps}
        </div>
        <div className="h-1.5 bg-plum-900/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-plum-900 transition-all"
            style={{
              width: `${((step + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {err && (
        <Alert tone="danger" className="mb-4">
          {err}
        </Alert>
      )}

      {currentSection === "basics" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">Tell us who you are</h2>
          <div>
            <Label htmlFor="displayName">Display name (your nickname on Evermore)</Label>
            <p className="text-xs text-plum-900/50 mb-2">
              This is how you appear at events and to matches — not your legal
              name. Pick a suggestion or type your own.
            </p>
            <Input
              id="displayName"
              value={data.displayName}
              list="display-name-suggestions"
              onChange={(e) =>
                setData((d) => ({ ...d, displayName: e.target.value }))
              }
              placeholder="e.g. The Quiet Oak"
            />
            <datalist id="display-name-suggestions">
              {nameSuggestions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-2">
              {nameSuggestions.slice(0, 5).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setData((d) => ({ ...d, displayName: n }))
                  }
                  className="rounded-full bg-plum-900/5 px-3 py-1 text-xs text-plum-900 hover:bg-plum-900/10"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
              placeholder="+254..."
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))}
              placeholder="Nairobi"
            />
          </div>
          <div>
            <Label htmlFor="bio">A short bio</Label>
            <Textarea
              id="bio"
              value={data.bio}
              onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="dreamDate">Your dream date</Label>
            <Textarea
              id="dreamDate"
              value={data.dreamDate}
              onChange={(e) =>
                setData((d) => ({ ...d, dreamDate: e.target.value }))
              }
              placeholder="A hike up Karura followed by a cooking class…"
            />
          </div>
          <div>
            <Label>Spending tier</Label>
            <div className="flex gap-2">
              {["standard", "premium", "elite"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setData((d) => ({ ...d, spendingTier: t }))
                  }
                  className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                    data.spendingTier === t
                      ? "bg-plum-900 text-plum-100"
                      : "bg-plum-900/5 text-plum-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentSection === "intent" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">
            Your relationship intent
          </h2>
          <p className="text-sm text-plum-900/60">
            Pick all that apply. These weigh heavier than interests in matching.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTENT_BADGES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    intentBadges: toggle(d.intentBadges, b.id),
                  }))
                }
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  data.intentBadges.includes(b.id)
                    ? "border-plum-900 bg-plum-900 text-plum-100"
                    : "border-plum-900/15 bg-white text-plum-900 hover:border-plum-900/40"
                }`}
              >
                <div className="font-medium">{b.label}</div>
                <div className="text-xs opacity-70 mt-1">{b.description}</div>
              </button>
            ))}
          </div>
          {contradictions.length > 0 && (
            <Alert tone="warning">
              Heads up — you&rsquo;ve picked badges that contradict
              ({contradictions.map((c) => `${c.a} vs ${c.b}`).join(", ")}). The
              Concierge will review.
            </Alert>
          )}
        </div>
      )}

      {currentSection === "interests" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">Interests</h2>
          <p className="text-sm text-plum-900/60">
            What lights you up? Picks help fuel Date Vault suggestions.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    interests: toggle(d.interests, i),
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  data.interests.includes(i)
                    ? "bg-plum-900 text-plum-100"
                    : "bg-plum-900/5 text-plum-900 hover:bg-plum-900/10"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSection === "theological" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">
            Theological alignment
          </h2>
          <p className="text-sm text-plum-900/60">
            Helps the engine match on shared foundations. Pick all that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {THEOLOGICAL.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    theologicalAlignment: toggle(d.theologicalAlignment, t),
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  data.theologicalAlignment.includes(t)
                    ? "bg-plum-900 text-plum-100"
                    : "bg-plum-900/5 text-plum-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSection === "dealbreakers" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">Deal-breakers</h2>
          <p className="text-sm text-plum-900/60">
            Faith-aligned filters for your matching pool. Pick all that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHRISTIAN_DEAL_BREAKERS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    dealBreakers: toggle(prev.dealBreakers, d),
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  data.dealBreakers.includes(d)
                    ? "bg-red-700 text-white"
                    : "bg-plum-900/5 text-plum-900"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSection.startsWith("q:") && (() => {
        const q = questions.find((qq) => `q:${qq.id}` === currentSection);
        if (!q) return null;
        const current = data.answers[q.id];
        return (
          <div className="space-y-4">
            <p className="text-xs text-plum-900/50 uppercase tracking-widest">
              {q.category ?? "Psychometric"}
            </p>
            <h2 className="text-display text-2xl text-plum-900">{q.prompt}</h2>
            {q.questionType === "single" && (
              <div className="flex flex-col gap-2">
                {(q.options ?? []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        answers: { ...d.answers, [q.id]: opt },
                      }))
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      current === opt
                        ? "border-plum-900 bg-plum-900 text-plum-100"
                        : "border-plum-900/15 bg-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.questionType === "multi" && (
              <div className="flex flex-wrap gap-2">
                {(q.options ?? []).map((opt) => {
                  const arr = Array.isArray(current) ? (current as string[]) : [];
                  const on = arr.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          answers: {
                            ...d.answers,
                            [q.id]: toggle(arr, opt),
                          },
                        }))
                      }
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        on
                          ? "bg-plum-900 text-plum-100"
                          : "bg-plum-900/5 text-plum-900"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
            {q.questionType === "scale" && (
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        answers: { ...d.answers, [q.id]: n },
                      }))
                    }
                    className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                      current === n
                        ? "bg-plum-900 text-plum-100"
                        : "bg-plum-900/5 text-plum-900"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.questionType === "freeform" && (
              <Textarea
                value={(current as string) ?? ""}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    answers: { ...d.answers, [q.id]: e.target.value },
                  }))
                }
              />
            )}
          </div>
        );
      })()}

      {currentSection === "review" && (
        <div className="space-y-4">
          <h2 className="text-display text-2xl text-plum-900">
            Your values, summarised
          </h2>
          <p className="text-sm text-plum-900/60">
            Confirm before your profile goes live. You can edit any time.
          </p>
          <div className="rounded-2xl bg-plum-900/5 p-4 text-sm space-y-2">
            <p>
              <strong>Name:</strong> {data.displayName} · <strong>Phone:</strong>{" "}
              {data.phone || "—"} · <strong>City:</strong> {data.city || "—"}
            </p>
            <p>
              <strong>Intent:</strong>{" "}
              <span className="flex gap-1 flex-wrap inline-flex">
                {data.intentBadges.map((b) => (
                  <Badge key={b} tone="mint">
                    {INTENT_BADGES.find((x) => x.id === b)?.label ?? b}
                  </Badge>
                ))}
              </span>
            </p>
            <p>
              <strong>Theology:</strong>{" "}
              {data.theologicalAlignment.join(", ") || "—"}
            </p>
            <p>
              <strong>Interests:</strong> {data.interests.join(", ") || "—"}
            </p>
            <p>
              <strong>Deal-breakers:</strong>{" "}
              {data.dealBreakers.join(", ") || "—"}
            </p>
            <p>
              <strong>Dream date:</strong> {data.dreamDate || "—"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="ghost"
          type="button"
          onClick={back}
          disabled={step === 0 || pending}
        >
          ← Back
        </Button>
        {currentSection === "review" ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => persist({ finalize: true })}
          >
            {pending ? "Finalising…" : "Take my profile live"}
          </Button>
        ) : (
          <Button type="button" disabled={pending} onClick={next}>
            {pending ? "Saving…" : "Continue →"}
          </Button>
        )}
      </div>
    </div>
  );
}
