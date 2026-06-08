import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "concierge",
  "admin",
  "super_admin",
  "facilitator",
  "host",
  "professional",
]);

export const userTierEnum = pgEnum("user_tier", [
  "free",
  "explorer",
  "couple",
  "elite",
  "concierge",
]);

export const userModeEnum = pgEnum("user_mode", [
  "explorer",
  "couple",
  "elite",
]);

export const intentBadgeEnum = pgEnum("intent_badge", [
  "slow_burner",
  "ready_for_covenant",
  "global_professional",
  "iron_sharpens_iron",
  "legacy_minded",
  "ready_for_marriage",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "in_progress",
  "completed",
  "cancelled",
]);

export const ticketTierEnum = pgEnum("ticket_tier", [
  "one_day",
  "two_day",
  "member_exclusive",
  "elite_only",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "pending_payment",
  "confirmed",
  "checked_in",
  "no_show",
  "refunded",
]);

export const paymentCurrencyEnum = pgEnum("payment_currency", ["KSH", "USD"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "tinypesa",
  "mpesa",
  "card",
  "cytton_mmf",
  "manual",
  "mock",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "single_opt_in",
  "mutual",
  "rejected",
  "expired",
]);

export const concierge_priority = pgEnum("concierge_priority", [
  "normal",
  "high",
  "urgent",
]);

export const messageVisibilityEnum = pgEnum("message_visibility", [
  "user",
  "concierge",
  "internal",
]);

export const programTypeEnum = pgEnum("program_type", [
  "agano_ascent",
  "marital_legacy",
  "parental_legacy",
  "premarital",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "withdrawn",
  "graduated",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "modern_rustic",
  "highland_rustic",
  "ensuite_suite",
  "self_catering",
  "private_cabin",
  "group_unit",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
]);

export const duoStatusEnum = pgEnum("duo_status", [
  "invited",
  "active",
  "desynced",
]);

export const aliasModeEnum = pgEnum("alias_mode", [
  "auto",
  "manual",
  "elite_hidden",
]);

export const tripScopeEnum = pgEnum("trip_scope", ["group", "private"]);

export const memberPathwayEnum = pgEnum("member_pathway", ["amari", "zahari"]);

export const vettingStatusEnum = pgEnum("vetting_status", [
  "pending",
  "approved",
  "rejected",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "rejected",
]);

export const zahariEngagementStatusEnum = pgEnum("zahari_engagement_status", [
  "pending_payment",
  "active",
  "matched",
  "completed",
]);

export const introductionStatusEnum = pgEnum("introduction_status", [
  "presented",
  "accepted",
  "declined",
  "scheduled",
  "completed",
  "cancelled",
]);

export const eventKindEnum = pgEnum("event_kind", ["social", "pulse_retreat"]);
