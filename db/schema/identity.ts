import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  userRoleEnum,
  userTierEnum,
  userModeEnum,
  intentBadgeEnum,
  memberPathwayEnum,
  vettingStatusEnum,
  genderEnum,
} from "./enums";

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth core tables. Field names match the Better Auth Drizzle adapter.
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  tier: userTierEnum("tier").notNull().default("free"),
  mode: userModeEnum("mode").notNull().default("explorer"),
  pathway: memberPathwayEnum("pathway"),
  vettingStatus: vettingStatusEnum("vetting_status")
    .notNull()
    .default("pending"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpiresAt: timestamp("ban_expires_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Domain profile, 1:1 with users.
// ─────────────────────────────────────────────────────────────────────────────
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    displayName: text("display_name"),
    phone: text("phone"),
    city: text("city"),
    gender: genderEnum("gender"),
    country: text("country").notNull().default("KE"),
    bio: text("bio"),
    dreamDate: text("dream_date"),
    photoUrl: text("photo_url"),
    photos: jsonb("photos")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    intentBadges: jsonb("intent_badges")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    interests: jsonb("interests")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    values: jsonb("values")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lookingFor: jsonb("looking_for")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    dealBreakers: jsonb("deal_breakers")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    theologicalAlignment: jsonb("theological_alignment")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // ── Create Profile (IRL) · Step 1: Identity ──────────────────────────────
    firstName: text("first_name"),
    lastName: text("last_name"),
    birthYear: integer("birth_year"),
    countryOfHeritage: text("country_of_heritage"),
    familialStatus: text("familial_status"), // single | divorced | widowed
    divorceCertified: boolean("divorce_certified").notNull().default(false),
    childrenCount: integer("children_count"),
    childrenCustody: text("children_custody"), // joint | primary_solo
    educationLevel: text("education_level"),
    profession: text("profession"),
    primaryIndustry: text("primary_industry"),
    personaCategory: text("persona_category"),
    personaAlias: text("persona_alias"),
    // ── Step 2: Relationship Intent ──────────────────────────────────────────
    altarTimeline: text("altar_timeline"), // covenant_foundations | covenant_ready
    relocationOpenness: text("relocation_openness"),
    familyPlanningVision: text("family_planning_vision"),
    spiritualRhythmsHome: jsonb("spiritual_rhythms_home")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    doctrinalAlignment: text("doctrinal_alignment"),
    professionalRhythm: text("professional_rhythm"),
    financialStewardship: jsonb("financial_stewardship")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    environmentPreference: text("environment_preference"),
    hospitalityFlow: text("hospitality_flow"),
    familyStatusCompatibility: text("family_status_compatibility"),
    householdBlueprint: text("household_blueprint"),
    // ── Step 4: Theological Alignment ────────────────────────────────────────
    coreFaithIdentity: text("core_faith_identity"),
    householdLeadership: text("household_leadership"),
    doctrinalFlexibility: text("doctrinal_flexibility"),
    spendingTier: text("spending_tier").notNull().default("standard"),
    onboardingProgress: integer("onboarding_progress").notNull().default(0),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    isPublic: boolean("is_public").notNull().default(true),
    silentMode: boolean("silent_mode").notNull().default(false),
    flaggedForReview: boolean("flagged_for_review").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("profiles_city_idx").on(t.city),
    index("profiles_silent_idx").on(t.silentMode),
    uniqueIndex("profiles_persona_alias_lower_uniq").on(
      sql`lower(${t.personaAlias})`,
    ),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Psychometric question bank + responses (resumable onboarding).
// ─────────────────────────────────────────────────────────────────────────────
export const psychometricQuestions = pgTable("psychometric_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bankVersion: integer("bank_version").notNull().default(1),
  step: integer("step").notNull(),
  prompt: text("prompt").notNull(),
  questionType: text("question_type").notNull(), // "single" | "multi" | "scale" | "freeform"
  options: jsonb("options").$type<string[]>(),
  scaleMin: integer("scale_min"),
  scaleMax: integer("scale_max"),
  category: text("category"),
  weight: integer("weight").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const psychometricResponses = pgTable(
  "psychometric_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => psychometricQuestions.id, { onDelete: "cascade" }),
    answer: jsonb("answer").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("psych_user_q_uniq").on(t.userId, t.questionId)],
);

// Tracks the active step so a user can resume mid-form.
export const onboardingProgress = pgTable("onboarding_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStep: integer("current_step").notNull().default(0),
  totalSteps: integer("total_steps").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type IntentBadge = (typeof intentBadgeEnum.enumValues)[number];
