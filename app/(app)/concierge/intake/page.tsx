import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conciergeIntakes } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/server";
import { submitIntake } from "./actions";

export const metadata = { title: "Concierge intake · Evermore" };

export default async function IntakePage() {
  const session = await requireSession();

  const existing = (
    await db
      .select()
      .from(conciergeIntakes)
      .where(eq(conciergeIntakes.userId, session.user.id))
      .limit(1)
  )[0];

  const r = (existing?.requirements ?? {}) as Record<string, string | undefined>;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href="/concierge"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Concierge
      </Link>

      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Private intake</span>
        <h1 className="text-3xl font-semibold tracking-tight">
          Tell us what would feel like a good match.
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Take your time. Anything you write here goes only to the Concierge — not to other
          members, not to staff, never on a public profile. You can come back and update this any
          time.
        </p>
        {existing && (
          <Badge variant={existing.status === "approved" ? "success" : "muted"}>
            Status: {existing.status.replace(/_/g, " ")}
          </Badge>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{existing ? "Update your intake" : "Begin"}</CardTitle>
          <CardDescription>About 10 minutes. Save when ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitIntake} className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Age range you're considering">
                <Input name="ageRange" required defaultValue={r.ageRange ?? ""} placeholder="e.g. 28–38" />
              </Field>
              <Field label="Where you're based">
                <Input name="city" required defaultValue={r.city ?? "Nairobi"} />
              </Field>
            </div>

            <Field label="What kind of partnership are you looking for?">
              <Textarea
                name="lookingFor"
                required
                rows={5}
                minLength={20}
                placeholder="Long-term, intentional, faith-aware, calm, ambitious — whatever shapes your search."
                defaultValue={r.lookingFor ?? ""}
              />
            </Field>

            <Field label="Any dealbreakers we should know?">
              <Textarea
                name="dealbreakers"
                rows={3}
                placeholder="Honest is better than polite."
                defaultValue={r.dealbreakers ?? ""}
              />
            </Field>

            <Field label="How private does this need to be?">
              <Textarea
                name="privacy"
                rows={3}
                placeholder="Public figure, in a separation, just discreet by nature — let us know."
                defaultValue={r.privacy ?? ""}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget you're comfortable with (KES)">
                <Input
                  name="budgetKes"
                  type="number"
                  min={0}
                  defaultValue={existing?.budgetKes ?? ""}
                  placeholder="35000"
                />
              </Field>
              <Field label="Timeline">
                <Input
                  name="timeline"
                  defaultValue={existing?.timeline ?? ""}
                  placeholder="e.g. The next quarter, no rush"
                />
              </Field>
            </div>

            <Button type="submit" size="lg">
              {existing ? "Update intake" : "Send to Concierge"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
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
