import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AMARI_BENEFITS,
  ZAHARI_BENEFITS,
  ZAHARI_PLANS,
} from "@/lib/membership/zahari-plans";
import {
  canDowngradeWithoutPenalty,
  isZahariSubscriptionActive,
  planLabel,
  zahariJourneyLabel,
} from "@/lib/membership/zahari-status";
import { AGANO_PAYBILL } from "@/lib/payments/paybill";
import { formatMoney } from "@/lib/utils/format";
import {
  updateAccountProfile,
  updatePrivacySettings,
  updateNotificationPrefs,
  toggleAutoRenew,
  addPaymentMethod,
  removePaymentMethod,
  cancelZahariSubscription,
  downgradeToAmari,
} from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ended?: string; downgraded?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);

  const payments = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.userId, user.id))
    .orderBy(desc(schema.payments.createdAt))
    .limit(20);

  const methods = await db
    .select()
    .from(schema.paymentMethods)
    .where(eq(schema.paymentMethods.userId, user.id))
    .orderBy(desc(schema.paymentMethods.createdAt));

  const pathway = user.pathway ?? "amari";
  const zahariActive = isZahariSubscriptionActive(eng);
  const prefs = profile?.notificationPrefs ?? {};

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-plum-900/50">
          Account
        </p>
        <h1 className="text-display text-3xl text-plum-900 mt-1">
          Account, Billing & Membership Tiers
        </h1>
        <p className="text-sm text-plum-900/60 mt-2">
          Manage your profile, active subscription, and financial preferences.
        </p>
      </header>

      {(sp.ended || sp.downgraded) && (
        <Card className="border-mint/40 bg-mint/10">
          <CardTitle>
            {sp.ended
              ? "Zahari subscription ended"
              : "Switched to Amari"}
          </CardTitle>
          <CardSubtitle className="mt-2">
            {sp.ended
              ? "No refund was issued. Elite perks and curated profile views are no longer available."
              : "You moved to Amari before payment — no consequences applied."}
          </CardSubtitle>
        </Card>
      )}

      {/* 1. Membership Tier & Status */}
      <section className="space-y-4">
        <h2 className="text-display text-2xl text-plum-900">
          1. Membership Tier & Status
        </h2>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={pathway === "zahari" ? "amber" : "mint"}>
              {pathway === "zahari" ? "Zahari · Elite" : "Amari · Standard"}
            </Badge>
            {eng && <Badge tone="neutral">{zahariJourneyLabel(eng)}</Badge>}
          </div>
          <CardTitle className="mt-3">
            {pathway === "zahari" ? "Elite tier" : "Standard tier"}
          </CardTitle>
          <CardSubtitle>
            {pathway === "zahari"
              ? "Private matching for high-discretion members."
              : "Complimentary fellowship pathway — events, Match Cards, mutual unlocks."}
          </CardSubtitle>

          <ul className="mt-4 space-y-1.5 text-sm text-plum-900/80">
            {(pathway === "zahari" ? ZAHARI_BENEFITS : AMARI_BENEFITS).map(
              (b) => (
                <li key={b}>· {b}</li>
              ),
            )}
          </ul>

          {pathway === "zahari" && eng && (
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-plum-900/50">Plan</dt>
                <dd className="font-medium">{planLabel(eng.plan)}</dd>
              </div>
              <div>
                <dt className="text-plum-900/50">Auto-renewal</dt>
                <dd className="font-medium">{eng.autoRenew ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-plum-900/50">Started</dt>
                <dd className="font-medium">
                  {eng.sovereignPaidAt
                    ? new Date(eng.sovereignPaidAt).toLocaleDateString("en-GB")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-plum-900/50">Renewal / expiry</dt>
                <dd className="font-medium">
                  {eng.expiresAt
                    ? new Date(eng.expiresAt).toLocaleDateString("en-GB")
                    : "—"}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {pathway === "amari" && (
              <Link href="/apply/zahari">
                <Button>Upgrade to Zahari</Button>
              </Link>
            )}
            {pathway === "zahari" && canDowngradeWithoutPenalty(eng) && (
              <form action={downgradeToAmari}>
                <Button type="submit" variant="outline">
                  Switch to Amari
                </Button>
              </form>
            )}
            {pathway === "zahari" && eng?.sovereignPaidAt && eng.status !== "cancelled" && (
              <form action={cancelZahariSubscription}>
                <input
                  type="hidden"
                  name="reason"
                  value="Member ended subscription — no refund"
                />
                <Button type="submit" variant="outline">
                  End Zahari (no refund)
                </Button>
              </form>
            )}
            {pathway === "zahari" && eng?.status === "pending_payment" && (
              <Link href="/concierge/zahari/pay">
                <Button>Complete payment</Button>
              </Link>
            )}
          </div>

          {pathway === "amari" && (
            <p className="mt-4 text-xs text-plum-900/50">
              Private matching packages ({ZAHARI_PLANS.map((p) => `${p.label} $${p.priceUsd}`).join(" · ")}) unlock after you upgrade to Zahari, pass the interview, and pay.
            </p>
          )}
        </Card>
      </section>

      {/* 2. Billing & Payment Management */}
      <section className="space-y-4">
        <h2 className="text-display text-2xl text-plum-900">
          2. Billing & Payment Management
        </h2>

        <Card>
          <CardTitle>Payment sources</CardTitle>
          <CardSubtitle className="mt-1">
            Saved mobile money options. Cards will appear here when USD checkout is enabled.
          </CardSubtitle>
          <ul className="mt-4 divide-y text-sm">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 gap-3">
                <span>
                  {m.label}
                  {m.mpesaPhone ? ` · ${m.mpesaPhone}` : ""}
                  {m.isDefault ? " · default" : ""}
                </span>
                <form action={removePaymentMethod}>
                  <input type="hidden" name="methodId" value={m.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
            {methods.length === 0 && (
              <li className="py-2 text-plum-900/50">No saved sources yet.</li>
            )}
          </ul>
          <form action={addPaymentMethod} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              name="label"
              placeholder="Label (e.g. Personal M-Pesa)"
              className="rounded-2xl border px-3 py-2 text-sm"
            />
            <input
              name="mpesaPhone"
              placeholder="2547…"
              required
              className="rounded-2xl border px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
          <p className="mt-4 text-xs text-plum-900/50">
            Manual Paybill: {AGANO_PAYBILL.paybill} · Account {AGANO_PAYBILL.accountNumber} ·{" "}
            {AGANO_PAYBILL.accountName}
          </p>
        </Card>

        {zahariActive && eng && (
          <Card>
            <CardTitle>Auto-renewal</CardTitle>
            <CardSubtitle className="mt-1">
              Turn off to stop renewing at the end of your current period.
            </CardSubtitle>
            <form action={toggleAutoRenew} className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                name="autoRenew"
                defaultChecked={eng.autoRenew}
                className="size-4"
              />
              <span className="text-sm">Keep auto-renewal on</span>
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          </Card>
        )}

        <Card>
          <CardTitle>Billing history & invoices</CardTitle>
          <ul className="mt-3 divide-y text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 py-2">
                <span>
                  {p.subjectKind.replaceAll("_", " ")} · {p.status}
                  <span className="block text-xs text-plum-900/40">
                    {new Date(p.createdAt).toLocaleString("en-GB")} · {p.provider}
                  </span>
                </span>
                <span className="font-medium whitespace-nowrap">
                  {formatMoney(Number(p.amount), p.currency)}
                </span>
              </li>
            ))}
            {payments.length === 0 && (
              <li className="py-2 text-plum-900/50">No invoices yet.</li>
            )}
          </ul>
        </Card>
      </section>

      {/* 3. Account Settings & Profile Control */}
      <section className="space-y-4">
        <h2 className="text-display text-2xl text-plum-900">
          3. Account Settings & Profile Control
        </h2>

        <Card>
          <CardTitle>Personal information</CardTitle>
          <form action={updateAccountProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-plum-900/60 sm:col-span-2">
              Name
              <input
                name="name"
                defaultValue={user.name}
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-plum-900/60 sm:col-span-2">
              Email
              <input
                value={user.email}
                disabled
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm bg-plum-900/5"
              />
            </label>
            <label className="text-xs text-plum-900/60">
              Phone
              <input
                name="phone"
                defaultValue={profile?.phone ?? ""}
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-plum-900/60">
              Location preferences
              <input
                name="locationPreferences"
                defaultValue={profile?.locationPreferences ?? ""}
                placeholder="e.g. Nairobi & coastal weekends"
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit" className="sm:col-span-2 w-fit">
              Save personal info
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Privacy & visibility</CardTitle>
          <CardSubtitle className="mt-1">
            Control matchmaking visibility. Report / block tools stay on match threads.
          </CardSubtitle>
          <form action={updatePrivacySettings} className="mt-4 space-y-3 text-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="matchmakingVisible"
                defaultChecked={profile?.matchmakingVisible ?? true}
                className="size-4"
              />
              Visible for matchmaking
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={profile?.isPublic ?? true}
                className="size-4"
              />
              Profile discoverable after mutual alignment
            </label>
            <Button type="submit" size="sm">
              Save privacy
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Notification preferences</CardTitle>
          <form action={updateNotificationPrefs} className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {(
              [
                ["email", "Email"],
                ["sms", "SMS"],
                ["inApp", "In-app"],
                ["matches", "Matches"],
                ["events", "Event reminders"],
                ["community", "Community updates"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={prefs[key] !== false}
                  className="size-4"
                />
                {label}
              </label>
            ))}
            <Button type="submit" size="sm" className="sm:col-span-2 w-fit">
              Save notifications
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
