import type { ZahariEngagement } from "@/db/schema/zahari";
import type { ZahariPlanSlug } from "@/lib/membership/zahari-plans";

const ACTIVE_STATUSES = new Set(["active", "matched"]);

export function isZahariSubscriptionActive(
  eng: Pick<ZahariEngagement, "status" | "sovereignPaidAt" | "expiresAt" | "cancelledAt"> | null | undefined,
) {
  if (!eng) return false;
  if (eng.cancelledAt) return false;
  if (!eng.sovereignPaidAt) return false;
  if (!ACTIVE_STATUSES.has(eng.status)) return false;
  if (eng.expiresAt && eng.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export function canZahariPay(
  eng: Pick<ZahariEngagement, "status" | "sovereignPaidAt"> | null | undefined,
) {
  if (!eng) return false;
  if (eng.sovereignPaidAt) return false;
  return eng.status === "pending_payment";
}

export function canDowngradeWithoutPenalty(
  eng: Pick<ZahariEngagement, "sovereignPaidAt" | "status"> | null | undefined,
) {
  if (!eng) return true;
  return !eng.sovereignPaidAt;
}

export function zahariJourneyLabel(
  eng: Pick<
    ZahariEngagement,
    "status" | "sovereignPaidAt" | "interviewScheduledAt" | "expiresAt"
  > | null | undefined,
) {
  if (!eng) return "Not started";
  switch (eng.status) {
    case "pending_interview":
      return "Awaiting interview booking";
    case "interview_scheduled":
      return "Interview scheduled";
    case "interview_rejected":
      return "Not a fit — can switch to Amari";
    case "pending_payment":
      return "Approved — payment required";
    case "active":
      return "Active Zahari membership";
    case "matched":
      return "Matched · Zahari";
    case "cancelled":
      return "Subscription ended";
    case "expired":
      return "Membership expired";
    case "completed":
      return "Journey completed";
    default:
      return eng.status;
  }
}

export function planLabel(plan: ZahariPlanSlug | string | null | undefined) {
  if (plan === "1_year") return "1 year";
  if (plan === "6_months") return "6 months";
  return "—";
}
