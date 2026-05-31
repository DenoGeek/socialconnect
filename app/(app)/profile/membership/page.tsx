import { requireUser } from "@/lib/auth";
import { MEMBERSHIP_PLANS, tierDisplayName, tierRank } from "@/lib/membership/plans";
import type { DbUserTier } from "@/lib/membership/plans";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeForm } from "./upgrade-form";

export default async function MembershipPage() {
  const user = await requireUser();
  const currentRank = tierRank(user.tier as DbUserTier);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Membership</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          Your current plan:{" "}
          <Badge tone="mint">{tierDisplayName(user.tier)}</Badge>
        </p>
        <p className="text-sm text-plum-900/60 mt-2">
          Standard, Premium, and Elite unlock different parts of the ecosystem.
          Pay once via M-Pesa STK; your tier updates when payment confirms.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => {
          const rank = tierRank(plan.tier);
          const isCurrent = user.tier === plan.tier;
          const canUpgrade = rank > currentRank || user.tier === "free";

          return (
            <Card
              key={plan.slug}
              className={isCurrent ? "ring-2 ring-plum-900" : ""}
            >
              <CardTitle>{plan.label}</CardTitle>
              <CardSubtitle>{plan.tagline}</CardSubtitle>
              <p className="text-display text-2xl text-plum-900 mt-3">
                KES {plan.priceKsh.toLocaleString()}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-plum-900/70">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {isCurrent && (
                <Badge tone="teal" className="mt-3">
                  Current plan
                </Badge>
              )}
              {canUpgrade && !isCurrent && (
                <UpgradeForm
                  planSlug={plan.slug}
                  planLabel={plan.label}
                  priceKsh={plan.priceKsh}
                />
              )}
              {!canUpgrade && !isCurrent && (
                <p className="text-xs text-plum-900/50 mt-4">
                  Included in your current tier or above.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
