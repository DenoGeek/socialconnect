export const INTENT_BADGES = [
  {
    id: "slow_burner",
    label: "Slow-Burner",
    description:
      "Build a deep foundation of friendship through events before the Agano commitment phase.",
  },
  {
    id: "ready_for_covenant",
    label: "Ready for Covenant",
    description:
      "Intentionally dating for marriage and ready for the pre-marital program within 12–24 months.",
  },
  {
    id: "ready_for_marriage",
    label: "Ready for Marriage",
    description: "Immediate clarity: pursuing marriage today.",
  },
  {
    id: "global_professional",
    label: "Global Professional",
    description:
      "Travel frequently; seek a partner who can travel or maintain a strong home base.",
  },
  {
    id: "iron_sharpens_iron",
    label: "Iron Sharpens Iron",
    description:
      "A partner who challenges and grows with me spiritually and professionally.",
  },
  {
    id: "legacy_minded",
    label: "Legacy Minded",
    description: "Focused on building a legacy together.",
  },
] as const;

export type IntentBadgeId = (typeof INTENT_BADGES)[number]["id"];

const CONTRADICTORY: Array<[IntentBadgeId, IntentBadgeId]> = [
  ["slow_burner", "ready_for_marriage"],
];

export function detectContradictions(badges: string[]) {
  const set = new Set(badges);
  return CONTRADICTORY.filter(([a, b]) => set.has(a) && set.has(b)).map(
    ([a, b]) => ({ a, b }),
  );
}
