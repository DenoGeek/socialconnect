import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conciergeIntakes, profiles, users } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewIntake } from "../actions";

interface PageProps {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export const metadata = { title: "Intake · Admin" };

export default async function IntakeReviewPage({ params, searchParams }: PageProps) {
  const { intakeId } = await params;
  const sp = await searchParams;

  const [intake] = await db
    .select()
    .from(conciergeIntakes)
    .where(eq(conciergeIntakes.id, intakeId))
    .limit(1);
  if (!intake) notFound();

  const [u] = await db
    .select({
      name: users.name,
      email: users.email,
      city: profiles.city,
      phone: profiles.phone,
      tier: profiles.tier,
      bio: profiles.bio,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, intake.userId))
    .limit(1);

  const r = (intake.requirements ?? {}) as Record<string, string | undefined>;
  const action = reviewIntake.bind(null, intake.id);

  return (
    <section className="flex flex-col gap-6 p-8">
      <Link
        href="/admin/concierge/intakes"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Intakes
      </Link>

      {sp.saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Saved.
        </div>
      )}

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="muted">{intake.status.replace(/_/g, " ")}</Badge>
          {u?.tier && <Badge variant="muted">{u.tier}</Badge>}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{u?.name ?? "Unknown"}</h1>
        <p className="text-sm text-stone-500">
          {u?.email}
          {u?.city ? ` · ${u.city}` : ""}
          {u?.phone ? ` · ${u.phone}` : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What they wrote</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm">
            <Field label="Age range">{r.ageRange}</Field>
            <Field label="Based in">{r.city}</Field>
            <Field label="Looking for">{r.lookingFor}</Field>
            <Field label="Dealbreakers">{r.dealbreakers}</Field>
            <Field label="Privacy needs">{r.privacy}</Field>
            <Field label="Budget">
              {intake.budgetKes ? `KES ${intake.budgetKes.toLocaleString("en-KE")}` : null}
            </Field>
            <Field label="Timeline">{intake.timeline}</Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Concierge action</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Move to status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={intake.status === "submitted" ? "in_review" : intake.status}
                  className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="in_review">In review</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="matched">Matched</option>
                  <option value="archived">Archive</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="privateNotes">Private notes (concierge only)</Label>
                <Textarea
                  id="privateNotes"
                  name="privateNotes"
                  rows={8}
                  defaultValue={intake.privateNotes ?? ""}
                  placeholder="Read between the lines, what's the brief? Who comes to mind?"
                />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {u?.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Profile bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-stone-700">{u.bio}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-stone-400">{label}</p>
      <div className="mt-1 whitespace-pre-line text-stone-700">
        {children || <span className="text-stone-400">—</span>}
      </div>
    </div>
  );
}
