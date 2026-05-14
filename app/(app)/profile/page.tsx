import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INTENT_BADGES } from "@/lib/intent/badges";
import { getAlias } from "@/lib/alias/assign";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);
  const alias = await getAlias(user.id, null);

  const onboardingDone = profile?.onboardingCompletedAt != null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl text-plum-900">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-plum-900/60">
          Your private profile. Visible only to the Concierge and your matches.
        </p>
      </div>

      {!onboardingDone && (
        <Card className="bg-amber-soft border border-amber">
          <CardTitle>Complete your psychometric onboarding</CardTitle>
          <CardSubtitle>
            Step {profile?.onboardingProgress ?? 0}: Map your values, lifestyle,
            and deal-breakers so the matching engine can read you.
          </CardSubtitle>
          <Link href="/profile/onboarding">
            <Button className="mt-4">Continue onboarding</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Your Alias</CardTitle>
          <CardSubtitle>
            Your event identity. Real name hidden until a mutual match.
          </CardSubtitle>
          <p className="mt-4 text-display text-2xl text-plum-900">
            {alias?.alias.name ?? "Unassigned — purchase an event ticket."}
          </p>
        </Card>

        <Card>
          <CardTitle>Intent Badges</CardTitle>
          <CardSubtitle>
            What you signal to the engine. Weighted higher than interests.
          </CardSubtitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile?.intentBadges ?? []).length === 0 ? (
              <p className="text-sm text-plum-900/60">None selected yet.</p>
            ) : (
              (profile?.intentBadges ?? []).map((b) => (
                <Badge key={b} tone="mint">
                  {INTENT_BADGES.find((x) => x.id === b)?.label ?? b}
                </Badge>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Profile</CardTitle>
        <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
          <dt className="text-plum-900/50">Display name</dt>
          <dd className="text-plum-900">
            {profile?.displayName ?? user.name}
          </dd>
          <dt className="text-plum-900/50">City</dt>
          <dd className="text-plum-900">{profile?.city ?? "—"}</dd>
          <dt className="text-plum-900/50">Spending tier</dt>
          <dd className="text-plum-900 capitalize">
            {profile?.spendingTier ?? "standard"}
          </dd>
          <dt className="text-plum-900/50">Tier</dt>
          <dd className="text-plum-900 capitalize">{user.tier}</dd>
          <dt className="text-plum-900/50">Mode</dt>
          <dd className="text-plum-900 capitalize">{user.mode}</dd>
        </dl>
        <div className="mt-6 flex gap-3">
          <Link href="/profile/onboarding">
            <Button variant="outline">Edit psychometric</Button>
          </Link>
          <Link href="/profile/mode">
            <Button variant="ghost">Switch mode</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
