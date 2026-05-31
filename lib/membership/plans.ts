import type { userTierEnum } from "@/db/schema/enums";

export type MembershipPlanSlug = "standard" | "premium" | "elite";
export type DbUserTier = (typeof userTierEnum.enumValues)[number];

/** Public product names map to existing DB tier enum values. */
export const MEMBERSHIP_PLANS = [
  {
    slug: "standard" as const,
    label: "Standard",
    tagline: "Pulse Hub, matching, and Date Vault",
    priceKsh: 1000,
    tier: "explorer" as DbUserTier,
    features: [
      "Event discovery & tickets",
      "Psychometric matching",
      "Date Vault member deals",
      "Alias at mixers",
    ],
  },
  {
    slug: "premium" as const,
    label: "Premium",
    tagline: "Couple mode, Agano programs, deeper concierge",
    priceKsh: 5000,
    tier: "couple" as DbUserTier,
    features: [
      "Everything in Standard",
      "Duo-Sync couple dashboard",
      "Agano Ascent program access",
      "Priority program enrollment",
    ],
  },
  {
    slug: "elite" as const,
    label: "Elite",
    tagline: "Silent portal, Hearth stays, white-glove concierge",
    priceKsh: 10000,
    tier: "elite" as DbUserTier,
    features: [
      "Everything in Premium",
      "Elite-only events & Hearth inventory",
      "Silent Match Portal",
      "Direct-line concierge",
    ],
  },
] as const;

export function planBySlug(slug: string) {
  return MEMBERSHIP_PLANS.find((p) => p.slug === slug);
}

export function planForTier(tier: DbUserTier) {
  return MEMBERSHIP_PLANS.find((p) => p.tier === tier);
}

/** Human-readable tier label for UI. */
export function tierDisplayName(tier: DbUserTier | string): string {
  switch (tier) {
    case "free":
      return "Free (not subscribed)";
    case "explorer":
      return "Standard";
    case "couple":
      return "Premium";
    case "elite":
      return "Elite";
    case "concierge":
      return "Concierge";
    default:
      return String(tier);
  }
}

export function tierRank(tier: DbUserTier): number {
  const order: DbUserTier[] = ["free", "explorer", "couple", "elite", "concierge"];
  return order.indexOf(tier);
}
