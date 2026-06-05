import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import {
  memberPathwayEnum,
  applicationStatusEnum,
  vettingStatusEnum,
} from "./enums";

export const memberApplications = pgTable(
  "member_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pathway: memberPathwayEnum("pathway").notNull(),
    status: applicationStatusEnum("status").notNull().default("draft"),
    ageAttested: integer("age_attested"),
    city: text("city"),
    intentSummary: text("intent_summary"),
    professionalContext: text("professional_context"),
    discretionRequirements: text("discretion_requirements"),
    legacyGoals: text("legacy_goals"),
    optIntoCandidatePool: boolean("opt_into_candidate_pool")
      .notNull()
      .default(false),
    reviewedByUserId: text("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
    rejectionReason: text("rejection_reason"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("app_user_idx").on(t.userId),
    index("app_status_idx").on(t.status),
    index("app_pathway_idx").on(t.pathway),
  ],
);

export const candidatePoolMembers = pgTable(
  "candidate_pool_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("candidate_pool_active_idx").on(t.active)],
);

export type MemberApplication = typeof memberApplications.$inferSelect;
