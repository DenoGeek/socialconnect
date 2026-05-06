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
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { payments } from "./payments";

export const eventTierEnum = pgEnum("event_tier", ["one_day", "two_day", "retreat"]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "completed",
  "cancelled",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "pending",
  "paid",
  "cancelled",
  "refunded",
  "checked_in",
]);
export const interactionPromptKindEnum = pgEnum("interaction_prompt_kind", [
  "icebreaker",
  "blind_response",
  "cooking_class",
  "speed_dating",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    tier: eventTierEnum("tier").notNull().default("one_day"),
    status: eventStatusEnum("status").notNull().default("draft"),
    venueName: text("venue_name"),
    city: text("city").notNull(),
    address: text("address"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull(),
    coverImageUrl: text("cover_image_url"),
    galleryImages: jsonb("gallery_images").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    itinerary: jsonb("itinerary"), // revealed post-purchase
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_status_starts_idx").on(t.status, t.startsAt),
    index("events_city_idx").on(t.city),
  ],
);

export const ticketTiers = pgTable(
  "ticket_tiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Standard", "Member", "Couple"
    priceKes: integer("price_kes").notNull(),
    memberDiscountKes: integer("member_discount_kes").notNull().default(0),
    maxQty: integer("max_qty").notNull(),
    soldQty: integer("sold_qty").notNull().default(0),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_tier_event_idx").on(t.eventId)],
);

export const ticketPurchases = pgTable(
  "ticket_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "restrict" }),
    tierId: uuid("tier_id").notNull().references(() => ticketTiers.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    status: ticketStatusEnum("status").notNull().default("pending"),
    qrToken: text("qr_token").notNull().unique(), // signed JWT
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ticket_user_idx").on(t.userId),
    index("ticket_event_status_idx").on(t.eventId, t.status),
    uniqueIndex("ticket_user_event_uniq").on(t.userId, t.eventId),
  ],
);

// Per-event icebreaker / blind-response prompts.
export const interactionPrompts = pgTable(
  "interaction_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    kind: interactionPromptKindEnum("kind").notNull().default("icebreaker"),
    prompt: text("prompt").notNull(),
    blindReveal: boolean("blind_reveal").notNull().default(false),
    pairKey: text("pair_key"), // groups two-sided prompts together
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("interaction_prompt_event_idx").on(t.eventId)],
);

export const interactionResponses = pgTable(
  "interaction_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promptId: uuid("prompt_id").notNull().references(() => interactionPrompts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("interaction_response_uniq").on(t.promptId, t.userId),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type TicketTier = typeof ticketTiers.$inferSelect;
export type TicketPurchase = typeof ticketPurchases.$inferSelect;
