import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { events } from "./events";

export const matchStatusEnum = pgEnum("match_status", [
  "pending_concierge",
  "introduced",
  "declined",
  "ghosted",
]);

export const handoffChannelEnum = pgEnum("handoff_channel", [
  "email",
  "whatsapp",
  "phone",
  "in_app",
]);

// Post-event "match cards". from_user → to_user (each user fills one per person).
// Stored by user_id (not alias) so concierge can resolve identities; the user
// only ever sees aliases via the application layer.
export const impressions = pgTable(
  "impressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    whatILiked: text("what_i_liked"),
    dreamDate: text("dream_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("impressions_uniq").on(t.eventId, t.fromUserId, t.toUserId),
    index("impressions_to_idx").on(t.toUserId, t.eventId),
  ],
);

// A match exists when impressions are mutual at a given event.
// Stored canonically with userA < userB (lexical) so we never duplicate.
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }), // null = concierge-direct
    userAId: text("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: matchStatusEnum("status").notNull().default("pending_concierge"),
    sourceImpressionAId: uuid("source_impression_a_id").references(() => impressions.id, { onDelete: "set null" }),
    sourceImpressionBId: uuid("source_impression_b_id").references(() => impressions.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("matches_pair_event_uniq").on(t.userAId, t.userBId, t.eventId),
    index("matches_status_idx").on(t.status),
  ],
);

export const matchHandoffs = pgTable(
  "match_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
    handledBy: text("handled_by").notNull().references(() => users.id, { onDelete: "set null" }),
    channel: handoffChannelEnum("channel").notNull(),
    suggestedDateVaultId: uuid("suggested_date_vault_id"), // soft FK to date_ideas
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("handoffs_match_idx").on(t.matchId)],
);

// Private vault — users leave post-date notes for the Concierge to refine matching.
export const dateFeedback = pgTable(
  "date_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: text("rating"), // "great" | "ok" | "no_chemistry" | etc.
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("date_feedback_match_idx").on(t.matchId)],
);

export type Impression = typeof impressions.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
