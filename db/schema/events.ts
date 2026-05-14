import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  index,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import {
  eventStatusEnum,
  ticketStatusEnum,
  ticketTierEnum,
  paymentCurrencyEnum,
} from "./enums";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    venue: text("venue"),
    city: text("city"),
    country: text("country").notNull().default("KE"),
    region: text("region"),
    heroImageUrl: text("hero_image_url"),
    gallery: jsonb("gallery")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    itinerary: jsonb("itinerary")
      .$type<Array<{ time: string; label: string; detail?: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(100),
    eliteOnly: boolean("elite_only").notNull().default(false),
    status: eventStatusEnum("status").notNull().default("draft"),
    impressionDeadlineHours: integer("impression_deadline_hours")
      .notNull()
      .default(24),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_status_idx").on(t.status),
    index("events_starts_idx").on(t.startsAt),
  ],
);

export const eventTickets = pgTable(
  "event_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tier: ticketTierEnum("tier").notNull(),
    label: text("label").notNull(),
    priceKsh: numeric("price_ksh", { precision: 12, scale: 2 }).notNull(),
    priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
    capacity: integer("capacity").notNull(),
    sold: integer("sold").notNull().default(0),
    memberDiscountPct: integer("member_discount_pct").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("event_tier_uniq").on(t.eventId, t.tier)],
);

export const ticketPurchases = pgTable(
  "ticket_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => eventTickets.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    qrToken: text("qr_token").notNull().unique(),
    status: ticketStatusEnum("status").notNull().default("pending_payment"),
    currency: paymentCurrencyEnum("currency").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    purchasedAt: timestamp("purchased_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("tp_user_idx").on(t.userId),
    index("tp_event_idx").on(t.eventId),
    index("tp_status_idx").on(t.status),
  ],
);

// Seating chart per event — admin curates tables by intent badges.
export const eventTables = pgTable("event_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  intentTheme: text("intent_theme"),
  capacity: integer("capacity").notNull().default(8),
});

export const eventTableSeats = pgTable(
  "event_table_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => eventTables.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("seat_table_user_uniq").on(t.tableId, t.userId)],
);

// Icebreaker / blind-response prompts attached to an event.
export const eventPrompts = pgTable("event_prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // "icebreaker" | "blind_response" | "game"
  prompt: text("prompt").notNull(),
  ordering: integer("ordering").notNull().default(0),
});

export const eventPromptResponses = pgTable(
  "event_prompt_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => eventPrompts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerUserId: text("partner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    response: text("response").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("prompt_resp_uniq").on(t.promptId, t.userId)],
);

// Free-form "Digital Interaction Log" notes user takes about other aliases.
export const interactionNotes = pgTable("interaction_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectAliasId: uuid("subject_alias_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventTicket = typeof eventTickets.$inferSelect;
export type TicketPurchase = typeof ticketPurchases.$inferSelect;
