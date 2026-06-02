import { notFound, redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteUserAccount, grantDiscountedTicket, updateUserTier } from "../actions";

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const me = await requireAdmin();
  const [u] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!u) notFound();
  if (me.role === "facilitator" && u.tier === "elite") {
    redirect("/admin/users");
  }

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, u.id))
    .limit(1);
  const tickets = await db
    .select()
    .from(schema.ticketPurchases)
    .where(eq(schema.ticketPurchases.userId, u.id));
  const ticketCatalog = await db
    .select({
      event: schema.events,
      ticket: schema.eventTickets,
    })
    .from(schema.eventTickets)
    .innerJoin(schema.events, eq(schema.events.id, schema.eventTickets.eventId));
  const matches = await db
    .select()
    .from(schema.matches)
    .where(
      or(
        eq(schema.matches.userAId, u.id),
        eq(schema.matches.userBId, u.id),
      ),
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{u.name}</h1>
        <p className="text-sm text-plum-900/60">{u.email}</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <Badge tone="neutral">{u.role.replace("_", " ")}</Badge>
          <Badge tone={u.tier === "elite" ? "amber" : "neutral"}>{u.tier}</Badge>
          <Badge tone="neutral">{u.mode}</Badge>
          {u.banned && <Badge tone="amber">Banned</Badge>}
        </div>
      </header>

      <Card>
        <CardTitle>Admin controls</CardTitle>
        <div className="mt-4 space-y-6">
          <form action={updateUserTier} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="userId" value={u.id} />
            <div>
              <label className="block text-xs uppercase tracking-widest text-plum-900/50 mb-1">
                Membership tier
              </label>
              <select
                name="tier"
                defaultValue={u.tier}
                className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
              >
                <option value="free">free</option>
                <option value="explorer">explorer</option>
                <option value="couple">couple</option>
                <option value="elite">elite</option>
                <option value="concierge">concierge</option>
              </select>
            </div>
            <Button type="submit" variant="outline">
              Save tier
            </Button>
          </form>

          <form action={grantDiscountedTicket} className="space-y-2">
            <input type="hidden" name="userId" value={u.id} />
            <label className="block text-xs uppercase tracking-widest text-plum-900/50">
              Grant discounted ticket
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                name="ticketId"
                className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
                required
              >
                <option value="">Select ticket</option>
                {ticketCatalog.map(({ event, ticket }) => (
                  <option key={ticket.id} value={ticket.id}>
                    {event.title} · {ticket.label}
                  </option>
                ))}
              </select>
              <select
                name="currency"
                defaultValue="KSH"
                className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
              >
                <option value="KSH">KSH</option>
                <option value="USD">USD</option>
              </select>
              <input
                name="discountPct"
                type="number"
                min={0}
                max={100}
                defaultValue={20}
                className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
                placeholder="Discount %"
              />
            </div>
            <Button type="submit" variant="outline">
              Grant ticket
            </Button>
          </form>

          <form action={deleteUserAccount}>
            <input type="hidden" name="userId" value={u.id} />
            <Button type="submit" variant="ghost" className="text-red-700">
              Delete user
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardTitle>Profile</CardTitle>
        {profile ? (
          <dl className="grid grid-cols-2 gap-y-2 text-sm mt-3">
            <dt className="text-plum-900/50">City</dt>
            <dd>{profile.city ?? "—"}</dd>
            <dt className="text-plum-900/50">Phone</dt>
            <dd>{profile.phone ?? "—"}</dd>
            <dt className="text-plum-900/50">Intent badges</dt>
            <dd>{(profile.intentBadges ?? []).join(", ") || "—"}</dd>
            <dt className="text-plum-900/50">Onboarding</dt>
            <dd>
              {profile.onboardingCompletedAt
                ? "Complete"
                : `${profile.onboardingProgress} steps`}
            </dd>
          </dl>
        ) : (
          <CardSubtitle>No profile yet.</CardSubtitle>
        )}
      </Card>

      <Card>
        <CardTitle>Tickets ({tickets.length})</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {tickets.map((t) => (
            <li key={t.id} className="flex justify-between py-2">
              <span className="font-mono">{t.code}</span>
              <Badge
                tone={t.status === "checked_in" ? "teal" : "neutral"}
              >
                {t.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Matches ({matches.length})</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {matches.map((m) => (
            <li key={m.id} className="flex justify-between py-2">
              <span>
                {m.status} · {m.compatibilityScore ?? "—"}/100
              </span>
              <span className="text-xs text-plum-900/50">
                {m.matchedAt
                  ? new Date(m.matchedAt).toLocaleDateString("en-GB")
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
