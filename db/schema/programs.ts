import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

export const partnerStatusEnum = pgEnum("partner_status", [
  "pending",
  "approved",
  "suspended",
]);

export const programKindEnum = pgEnum("program_kind", [
  "premarital",
  "marital",
  "parental",
  "counseling",
  "other",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "pending",
  "active",
  "completed",
  "dropped",
]);

// Churches, institutions, retreat centers — facilitators with a B2B login.
export const partners = pgTable(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    city: text("city"),
    status: partnerStatusEnum("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("partner_status_idx").on(t.status)],
);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
    kind: programKindEnum("kind").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    curriculum: jsonb("curriculum"), // milestone definitions
    feeKes: integer("fee_kes").notNull().default(0),
    durationWeeks: integer("duration_weeks"),
    location: text("location"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("program_partner_idx").on(t.partnerId),
    index("program_kind_published_idx").on(t.kind, t.published),
  ],
);

export const cohorts = pgTable(
  "cohorts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
    endsOn: timestamp("ends_on", { withTimezone: true }),
    capacity: integer("capacity").notNull().default(20),
    enrolledCount: integer("enrolled_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cohort_program_idx").on(t.programId)],
);

// A couple is two users sharing the same enrollment via a shared invite token.
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cohortId: uuid("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
    primaryUserId: text("primary_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    partnerUserId: text("partner_user_id").references(() => users.id, { onDelete: "set null" }),
    inviteToken: text("invite_token").unique(),
    status: enrollmentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("enrollment_cohort_idx").on(t.cohortId),
    index("enrollment_primary_idx").on(t.primaryUserId),
  ],
);

// Facilitator-updated milestones; couple sees their own progress only.
export const labProgress = pgTable(
  "lab_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
    milestoneKey: text("milestone_key").notNull(), // matches a curriculum entry
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("lab_progress_uniq").on(t.enrollmentId, t.milestoneKey),
  ],
);

export type Partner = typeof partners.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Cohort = typeof cohorts.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
