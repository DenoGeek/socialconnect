import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { areGendersCompatible } from "@/lib/profile/gender";

const INTENT_WEIGHT = 50; // each shared intent badge
const INTEREST_WEIGHT = 5; // each shared interest
const THEOLOGY_WEIGHT = 20; // each shared theological alignment
const DEAL_BREAKER_PENALTY = -100; // if either is a deal-breaker for the other

// Create Profile (IRL) structured-field alignment weights.
const ALTAR_TIMELINE_WEIGHT = 30;
const FAITH_IDENTITY_WEIGHT = 25;
const LEADERSHIP_WEIGHT = 25;
const FAMILY_PLANNING_WEIGHT = 15;
const HOUSEHOLD_BLUEPRINT_WEIGHT = 15;
const DOCTRINAL_FLEXIBILITY_WEIGHT = 15;
const RELOCATION_WEIGHT = 10;
const ENVIRONMENT_WEIGHT = 10;
const SPIRITUAL_RHYTHM_WEIGHT = 5; // each shared rhythm
const CHILDREN_MISMATCH_PENALTY = -100; // wants no previous children, partner has children

function sameNonEmpty(a?: string | null, b?: string | null) {
  return Boolean(a) && Boolean(b) && a === b;
}

export async function scoreCompatibility(userAId: string, userBId: string) {
  const profiles = await db
    .select()
    .from(schema.profiles)
    .where(inArray(schema.profiles.userId, [userAId, userBId]));
  const a = profiles.find((p) => p.userId === userAId);
  const b = profiles.find((p) => p.userId === userBId);
  if (!a || !b)
    return { score: 0, sharedIntents: [] as string[], sharedInterests: [] };

  if (!areGendersCompatible(a, b)) {
    return { score: 0, sharedIntents: [] as string[], sharedInterests: [] };
  }

  const aIntents = new Set(a.intentBadges ?? []);
  const bIntents = new Set(b.intentBadges ?? []);
  const sharedIntents = Array.from(aIntents).filter((x) => bIntents.has(x));

  const aInterests = new Set(a.interests ?? []);
  const bInterests = new Set(b.interests ?? []);
  const sharedInterests = Array.from(aInterests).filter((x) =>
    bInterests.has(x),
  );

  const aTheo = new Set(a.theologicalAlignment ?? []);
  const bTheo = new Set(b.theologicalAlignment ?? []);
  const sharedTheo = Array.from(aTheo).filter((x) => bTheo.has(x));

  // Deal-breaker check (very lightweight: shared free-form strings).
  const aDb = new Set((a.dealBreakers ?? []).map((x) => x.toLowerCase()));
  const bDb = new Set((b.dealBreakers ?? []).map((x) => x.toLowerCase()));
  const triggered =
    Array.from(aInterests).some((i) => bDb.has(i.toLowerCase())) ||
    Array.from(bInterests).some((i) => aDb.has(i.toLowerCase()));

  // Structured Create Profile alignment.
  const aRhythms = new Set(a.spiritualRhythmsHome ?? []);
  const sharedRhythms = Array.from(new Set(b.spiritualRhythmsHome ?? [])).filter(
    (x) => aRhythms.has(x),
  );

  let alignmentScore = 0;
  if (sameNonEmpty(a.altarTimeline, b.altarTimeline))
    alignmentScore += ALTAR_TIMELINE_WEIGHT;
  if (sameNonEmpty(a.coreFaithIdentity, b.coreFaithIdentity))
    alignmentScore += FAITH_IDENTITY_WEIGHT;
  if (sameNonEmpty(a.householdLeadership, b.householdLeadership))
    alignmentScore += LEADERSHIP_WEIGHT;
  if (sameNonEmpty(a.familyPlanningVision, b.familyPlanningVision))
    alignmentScore += FAMILY_PLANNING_WEIGHT;
  if (sameNonEmpty(a.householdBlueprint, b.householdBlueprint))
    alignmentScore += HOUSEHOLD_BLUEPRINT_WEIGHT;
  if (sameNonEmpty(a.doctrinalFlexibility, b.doctrinalFlexibility))
    alignmentScore += DOCTRINAL_FLEXIBILITY_WEIGHT;
  if (sameNonEmpty(a.relocationOpenness, b.relocationOpenness))
    alignmentScore += RELOCATION_WEIGHT;
  if (sameNonEmpty(a.environmentPreference, b.environmentPreference))
    alignmentScore += ENVIRONMENT_WEIGHT;
  alignmentScore += sharedRhythms.length * SPIRITUAL_RHYTHM_WEIGHT;

  // Family compatibility guardrail (doc Step 2 · Family & Household Structure).
  const childrenMismatch =
    (a.familyStatusCompatibility === "no_previous_children" &&
      (b.childrenCount ?? 0) > 0) ||
    (b.familyStatusCompatibility === "no_previous_children" &&
      (a.childrenCount ?? 0) > 0);

  let score =
    sharedIntents.length * INTENT_WEIGHT +
    sharedInterests.length * INTEREST_WEIGHT +
    sharedTheo.length * THEOLOGY_WEIGHT +
    alignmentScore;
  if (triggered) score += DEAL_BREAKER_PENALTY;
  if (childrenMismatch) score += CHILDREN_MISMATCH_PENALTY;

  // Normalize 0-100.
  const normalized = Math.max(0, Math.min(100, score));
  return {
    score: normalized,
    sharedIntents,
    sharedInterests,
  };
}

// Used by admin "shadow matching" for Elite users.
export async function rankCandidatesForUser(
  userId: string,
  candidateIds: string[],
) {
  const results = await Promise.all(
    candidateIds.map(async (cid) => ({
      candidateId: cid,
      ...(await scoreCompatibility(userId, cid)),
    })),
  );
  return results.sort((a, b) => b.score - a.score);
}

export async function isExcluded(userAId: string, userBId: string) {
  const { isPairExcluded } = await import("./exclusions");
  return isPairExcluded(userAId, userBId);
}
