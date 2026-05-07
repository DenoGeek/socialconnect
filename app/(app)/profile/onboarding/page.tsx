import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { profiles, psychometricQuestions, psychometricResponses } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth/server";
import { markOnboardingComplete, saveAnswer, saveProfileBasics } from "./actions";

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export const metadata = { title: "Onboarding · Evermore" };

export default async function OnboardingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const step = sp.step === "questions" ? "questions" : "basics";

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const questions = await db
    .select()
    .from(psychometricQuestions)
    .where(eq(psychometricQuestions.active, true))
    .orderBy(asc(psychometricQuestions.bankVersion), asc(psychometricQuestions.weight));

  const responses = questions.length
    ? await db
        .select()
        .from(psychometricResponses)
        .where(
          and(
            eq(psychometricResponses.userId, session.user.id),
            inArray(
              psychometricResponses.questionId,
              questions.map((q) => q.id),
            ),
          ),
        )
    : [];
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer as string]));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href="/profile"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Profile
      </Link>

      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Onboarding</span>
        <h1 className="text-3xl font-semibold tracking-tight">
          {step === "questions" ? "A few honest questions." : "Tell us a little about you."}
        </h1>
        <p className="text-sm text-stone-600">
          The more thoughtful your answers, the better the Concierge can hold you in mind. Only the
          Concierge sees your psychometric responses — never other members.
        </p>
        <Steps current={step} />
      </header>

      {step === "basics" ? (
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Two minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveProfileBasics} className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <Input
                    name="displayName"
                    required
                    defaultValue={profile?.displayName ?? session.user.name}
                  />
                </Field>
                <Field label="City">
                  <Input name="city" required defaultValue={profile?.city ?? "Nairobi"} />
                </Field>
                <Field label="Phone (optional)">
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    defaultValue={profile?.phone ?? ""}
                  />
                </Field>
                <Field label="Interests (comma-separated)">
                  <Input
                    name="interests"
                    placeholder="climbing, jazz, gardening"
                    defaultValue={profile?.interests?.join(", ") ?? ""}
                  />
                </Field>
              </div>
              <Field label="A short paragraph about you">
                <Textarea
                  name="bio"
                  rows={5}
                  placeholder="Whatever feels true today."
                  defaultValue={profile?.bio ?? ""}
                />
              </Field>
              <Button type="submit" size="lg">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-stone-500">
                <p>No psychometric questions are active yet.</p>
                <p className="mt-2 text-xs text-stone-400">
                  Admins seed the question bank. The Concierge can match without these — basics
                  alone are enough to begin.
                </p>
                <form action={markOnboardingComplete} className="mt-4">
                  <Button type="submit">I&apos;m done</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <ul className="flex flex-col gap-4">
                {questions.map((q) => {
                  const answered = responseMap.has(q.id);
                  const existing = (responseMap.get(q.id) ?? "") as string;
                  return (
                    <li key={q.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{q.prompt}</CardTitle>
                          {q.category && <CardDescription>{q.category}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                          <form action={saveAnswer} className="flex flex-col gap-3">
                            <input type="hidden" name="questionId" value={q.id} />
                            <Textarea
                              name="answer"
                              rows={3}
                              defaultValue={existing}
                              placeholder="Take your time."
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-stone-500">
                                {answered ? "Saved · update any time" : "Unanswered"}
                              </span>
                              <Button type="submit" size="sm" variant="outline">
                                Save answer
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
              <form action={markOnboardingComplete}>
                <Button type="submit" size="lg">
                  Done for now
                </Button>
              </form>
            </>
          )}
        </>
      )}
    </main>
  );
}

function Steps({ current }: { current: "basics" | "questions" }) {
  return (
    <ol className="mt-2 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-stone-400">
      <li className={current === "basics" ? "text-stone-900" : ""}>1 · Basics</li>
      <span aria-hidden>—</span>
      <li className={current === "questions" ? "text-stone-900" : ""}>2 · Reflections</li>
    </ol>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
