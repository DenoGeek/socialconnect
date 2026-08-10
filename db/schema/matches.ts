import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { events } from "./events";
import { matchStatusEnum } from "./enums";

// Impression form: explorer flags interest in an alias after an event.
export const impressions = pgTable(
  "impressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    likedReason: text("liked_reason"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("impression_event_pair_uniq").on(
      t.eventId,
      t.fromUserId,
      t.toUserId,
    ),
    index("impression_to_idx").on(t.toUserId),
  ],
);

// Materialized match record once both impressions exist.
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    userAId: text("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: matchStatusEnum("status").notNull().default("single_opt_in"),
    compatibilityScore: integer("compatibility_score"),
    sharedIntents: jsonb("shared_intents")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    bridgeUpsellSentAt: timestamp("bridge_upsell_sent_at", {
      withTimezone: true,
    }),
    firstConversationAt: timestamp("first_conversation_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("match_user_pair_uniq").on(t.userAId, t.userBId, t.eventId),
    index("match_status_idx").on(t.status),
  ],
);

// Bridge upsell suggestion log — links a match to a Date Vault deal.
export const matchBridgeUpsells = pgTable("match_bridge_upsells", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id"),
  reasoning: text("reasoning"),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  retargetCount: integer("retarget_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Post-date feedback after the Bridge Date.
export const matchFeedback = pgTable("match_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Excludes ex-partners / de-synced couples from future match pools.
export const matchExclusions = pgTable(
  "match_exclusions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userAId: text("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    permanent: boolean("permanent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("exclusion_pair_uniq").on(t.userAId, t.userBId)],
);

/** Member↔member chat — unlocked only after a mutual post-event match. */
export const matchMessages = pgTable(
  "match_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("match_msg_match_idx").on(t.matchId)],
);

export type Impression = typeof impressions.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchMessage = typeof matchMessages.$inferSelect;
