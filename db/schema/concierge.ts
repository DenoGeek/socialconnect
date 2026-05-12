import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { concierge_priority, messageVisibilityEnum } from "./enums";

// Pre-onboarding consultation reservation: name + phone + email.
export const conciergeIntakes = pgTable(
  "concierge_intakes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    requirements: text("requirements"),
    assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    convertedUserId: text("converted_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    priority: concierge_priority("priority").notNull().default("high"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("intake_priority_idx").on(t.priority)],
);

// Elite ↔ Concierge thread (1:1, persistent).
export const conciergeThreads = pgTable("concierge_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  assignedConciergeId: text("assigned_concierge_id").references(
    () => users.id,
    { onDelete: "set null" },
  ),
  conciergeOnDuty: boolean("concierge_on_duty").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conciergeMessages = pgTable(
  "concierge_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => conciergeThreads.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments")
      .$type<Array<{ name: string; url: string; ephemeral?: boolean }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    visibility: messageVisibilityEnum("visibility").notNull().default("user"),
    priority: concierge_priority("priority").notNull().default("normal"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("msg_thread_idx").on(t.threadId),
    index("msg_priority_idx").on(t.priority),
  ],
);

// Concierge can pre-stage "shadow matches" for elite users without notifying.
export const shadowMatchSuggestions = pgTable("shadow_match_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  eliteUserId: text("elite_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  candidateUserId: text("candidate_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rationale: text("rationale"),
  silent: boolean("silent").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ConciergeIntake = typeof conciergeIntakes.$inferSelect;
export type ConciergeMessage = typeof conciergeMessages.$inferSelect;
