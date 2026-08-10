export const ZAHARI_PLANS = [
  {
    slug: "6_months" as const,
    label: "6 months",
    months: 6,
    priceUsd: 1500,
    features: [
      "Private matching services",
      "Date packages & ideas",
      "Date concierge services",
      "Access to the exclusive elite couples pool",
      "Profile views of hand-curated match candidates",
    ],
  },
  {
    slug: "1_year" as const,
    label: "1 year",
    months: 12,
    priceUsd: 2800,
    features: [
      "Private matching services",
      "Date packages & ideas",
      "Date concierge services",
      "Access to the exclusive elite couples pool",
      "Profile views of hand-curated match candidates",
    ],
  },
] as const;

export type ZahariPlanSlug = (typeof ZAHARI_PLANS)[number]["slug"];

export function zahariPlanBySlug(slug: string | null | undefined) {
  return ZAHARI_PLANS.find((p) => p.slug === slug) ?? null;
}

export function zahariExpiryFromNow(slug: ZahariPlanSlug, from = new Date()) {
  const plan = zahariPlanBySlug(slug);
  if (!plan) return null;
  const expires = new Date(from);
  expires.setMonth(expires.getMonth() + plan.months);
  return expires;
}

export const AMARI_BENEFITS = [
  "Real-world curated gatherings",
  "Match Cards after events",
  "Mutual-match profile unlock",
  "Date package ideas after mutual choice",
  "Complimentary pathway — no membership fee",
] as const;

export const ZAHARI_BENEFITS = [
  "Private matching by the concierge team",
  "Profile views of curated candidates after interview",
  "Date packages & date concierge",
  "Exclusive elite couples pool",
  "All Amari access included",
] as const;
