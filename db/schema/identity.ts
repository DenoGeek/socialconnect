import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "concierge",
  "admin",
  "partner",
  "host",
  "professional",
]);

export const userTierEnum = pgEnum("user_tier", [
  "free",
  "concierge",
  "elite",
]);

// Better Auth core tables — fields match the Better Auth Drizzle adapter contract.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpiresAt: timestamp("ban_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Domain profile, separate from auth identity. 1:1 with users.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    tier: userTierEnum("tier").notNull().default("free"),
    displayName: text("display_name"),
    phone: text("phone"),
    city: text("city"),
    country: text("country").notNull().default("KE"),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    photos: jsonb("photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    lookingFor: jsonb("looking_for").$type<Record<string, unknown>>(),
    values: jsonb("values").$type<Record<string, unknown>>(),
    interests: jsonb("interests").$type<string[]>(),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("profiles_city_idx").on(t.city),
    index("profiles_tier_idx").on(t.tier),
  ],
);

// Versioned psychometric question bank — admin-managed.
export const psychometricQuestions = pgTable("psychometric_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bankVersion: integer("bank_version").notNull().default(1),
  prompt: text("prompt").notNull(),
  questionType: text("question_type").notNull(), // "single" | "multi" | "scale" | "freeform"
  options: jsonb("options").$type<string[]>(),
  scaleMin: integer("scale_min"),
  scaleMax: integer("scale_max"),
  category: text("category"),
  weight: integer("weight").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const psychometricResponses = pgTable(
  "psychometric_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => psychometricQuestions.id, { onDelete: "cascade" }),
    answer: jsonb("answer").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("psych_user_q_uniq").on(t.userId, t.questionId),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
