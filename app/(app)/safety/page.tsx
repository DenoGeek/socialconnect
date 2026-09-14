import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  reportMember,
  triggerPanicAlert,
  updateEmergencyContact,
} from "./actions";

const SAFETY_TIPS = [
  "Meet in public spaces for early dates; tell a trusted person where you are going.",
  "Never share banking details, OTPs, or money requests with matches.",
  "If something feels off, leave — and use Report or the panic button immediately.",
  "Agano Evermore is for covenant-minded adults. Harassment or deception leads to suspension or ban.",
  "Concierge can help plan dates; you do not owe anyone ongoing contact after a mutual match.",
];

export default async function SafetyPage() {
  const user = await requireUser();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  const mutualMatches = await db
    .select({
      match: schema.matches,
    })
    .from(schema.matches)
    .where(eq(schema.matches.status, "mutual"));

  const myMatches = mutualMatches.filter(
    (m) => m.match.userAId === user.id || m.match.userBId === user.id,
  );

  const otherIds = myMatches.map((m) =>
    m.match.userAId === user.id ? m.match.userBId : m.match.userAId,
  );
  const others =
    otherIds.length > 0
      ? await db.select().from(schema.users)
      : [];
  const otherUsers = others.filter((u) => otherIds.includes(u.id));

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Contact & Safety</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          Report a member, reach your emergency contacts, and review house rules.
        </p>
      </header>

      <Card className="border-amber/40 bg-amber-soft/40">
        <Badge tone="amber">Emergency protocol</Badge>
        <CardTitle className="mt-2">Panic alert</CardTitle>
        <CardSubtitle className="mt-1">
          Notifies Agano admins and your saved emergency contact immediately.
        </CardSubtitle>
        <form action={triggerPanicAlert} className="mt-4 space-y-3">
          <textarea
            name="note"
            placeholder="Optional note (location, what’s happening)"
            className="w-full rounded-2xl border px-3 py-2 text-sm min-h-20"
          />
          <Button type="submit" variant="danger" className="w-full">
            Send emergency alert
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Emergency contact</CardTitle>
        <form action={updateEmergencyContact} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="emergencyContactName"
            placeholder="Contact name"
            defaultValue={profile?.emergencyContactName ?? ""}
            className="rounded-2xl border px-3 py-2 text-sm"
          />
          <input
            name="emergencyContactPhone"
            placeholder="2547…"
            defaultValue={profile?.emergencyContactPhone ?? ""}
            className="rounded-2xl border px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" className="sm:col-span-2 w-fit">
            Save emergency contact
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Report a member</CardTitle>
        <CardSubtitle className="mt-1">
          Reports go to the Safety inbox. The person is excluded from your future matching.
        </CardSubtitle>
        {otherUsers.length === 0 ? (
          <p className="mt-3 text-sm text-plum-900/50">
            You can report people you have mutually matched with. No mutual matches yet.
          </p>
        ) : (
          <form action={reportMember} className="mt-4 space-y-3">
            <select
              name="reportedUserId"
              required
              className="w-full rounded-2xl border px-3 py-2 text-sm"
            >
              <option value="">Select member</option>
              {otherUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <textarea
              name="reason"
              required
              placeholder="What happened?"
              className="w-full rounded-2xl border px-3 py-2 text-sm min-h-24"
            />
            <Button type="submit" variant="outline">
              Submit report
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <CardTitle>Safety tips & house rules</CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-plum-900/80">
          {SAFETY_TIPS.map((tip) => (
            <li key={tip}>· {tip}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
