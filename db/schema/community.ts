import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { events } from "./events";
import { matches } from "./matches";

/** In-app notification inbox (also used for announcement delivery). */
export const inAppNotifications = pgTable(
  "in_app_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // announcement | warning | safety | match | system
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("in_app_notif_user_idx").on(t.userId),
    index("in_app_notif_created_idx").on(t.createdAt),
  ],
);

/** Staff broadcasts — email + in-app, with optional segment filters. */
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** everyone | amari | zahari */
    pathwayFilter: text("pathway_filter").notNull().default("everyone"),
    cityFilter: text("city_filter"),
    eventIdFilter: uuid("event_id_filter").references(() => events.id, {
      onDelete: "set null",
    }),
    sendEmail: boolean("send_email").notNull().default(true),
    sendInApp: boolean("send_in_app").notNull().default(true),
    recipientCount: integer("recipient_count").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("announcements_sent_idx").on(t.sentAt)],
);

/** Panic / emergency alerts — notify admin + member emergency contact. */
export const panicAlerts = pgTable(
  "panic_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByUserId: text("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("panic_alerts_open_idx").on(t.resolvedAt)],
);

/** Always-available icebreaker / conversation prompt library. */
export const icebreakerPrompts = pgTable(
  "icebreaker_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull().default("general"),
    prompt: text("prompt").notNull(),
    active: boolean("active").notNull().default(true),
    ordering: integer("ordering").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("icebreaker_active_idx").on(t.active)],
);

/** Couples community — vetted matched/married couples only. */
export const couplesCommunityMembers = pgTable(
  "couples_community_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    partnerUserId: text("partner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    vettedAt: timestamp("vetted_at", { withTimezone: true }),
    vettedByUserId: text("vetted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("couples_community_status_idx").on(t.status)],
);

export const couplesCommunityPosts = pgTable(
  "couples_community_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("couples_posts_created_idx").on(t.createdAt)],
);

/** Profile moderation queue (photos, bio, ID docs). */
export const moderationItems = pgTable(
  "moderation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // photo | bio | id_document | profile
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewNotes: text("review_notes"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("moderation_status_idx").on(t.status),
    index("moderation_user_idx").on(t.userId),
  ],
);

/** Mutual contact exchange after match (phone / WhatsApp). */
export const matchContactExchanges = pgTable(
  "match_contact_exchanges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" })
      .unique(),
    userASharedAt: timestamp("user_a_shared_at", { withTimezone: true }),
    userBSharedAt: timestamp("user_b_shared_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("match_contact_match_idx").on(t.matchId)],
);

/** Post-event safety / value-alignment NPS scores. */
export const eventNpsResponses = pgTable(
  "event_nps_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 0-10
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("event_nps_event_idx").on(t.eventId)],
);

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type PanicAlert = typeof panicAlerts.$inferSelect;
export type IcebreakerPrompt = typeof icebreakerPrompts.$inferSelect;
export type ModerationItem = typeof moderationItems.$inferSelect;
