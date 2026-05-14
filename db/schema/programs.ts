import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { programTypeEnum, enrollmentStatusEnum } from "./enums";

// Institutions / churches that run programs.
export const institutions = pgTable("institutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  country: text("country").notNull().default("KE"),
  logoUrl: text("logo_url"),
  publicShowcase: boolean("public_showcase").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Facilitators belong to an institution.
export const institutionMembers = pgTable(
  "institution_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("facilitator"),
  },
  (t) => [uniqueIndex("inst_user_uniq").on(t.institutionId, t.userId)],
);

// Program catalogue.
export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  kind: programTypeEnum("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks").notNull().default(10),
  unlocksProgramId: uuid("unlocks_program_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Lessons / modules.
export const programLessons = pgTable(
  "program_lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    videoUrl: text("video_url"),
    connectionBoxUrl: text("connection_box_url"),
  },
  (t) => [uniqueIndex("lesson_program_week_uniq").on(t.programId, t.week)],
);

// Cohort run of a program.
export const cohorts = pgTable("cohorts", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  facilitatorUserId: text("facilitator_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Enrollment is per couple (or solo for pre-marital intake).
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    primaryUserId: text("primary_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerUserId: text("partner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    graduatedAt: timestamp("graduated_at", { withTimezone: true }),
    verifiedByFacilitatorId: text("verified_by_facilitator_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("enroll_status_idx").on(t.status),
    index("enroll_primary_idx").on(t.primaryUserId),
  ],
);

// Per-lesson completion (couple-synced: completing on User A flips it for User B too).
export const lessonCompletions = pgTable(
  "lesson_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => programLessons.id, { onDelete: "cascade" }),
    completedByUserId: text("completed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reflection: text("reflection"),
    photoUrls: jsonb("photo_urls")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("lc_enroll_lesson_uniq").on(t.enrollmentId, t.lessonId)],
);

// Private facilitator coaching note visible to the enrolled couple but not other cohort members.
export const coachingNotes = pgTable("coaching_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Program = typeof programs.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Institution = typeof institutions.$inferSelect;
