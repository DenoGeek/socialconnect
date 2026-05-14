import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { matches } from "./matches";

export const datePartners = pgTable("date_partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category"), // "restaurant" | "spa" | "private_chef" | "hotel"
  city: text("city"),
  region: text("region"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  active: boolean("active").notNull().default(true),
  feedbackScore: integer("feedback_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dateVaultDeals = pgTable(
  "date_vault_deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => datePartners.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    discountCode: text("discount_code"),
    discountPct: integer("discount_pct"),
    originalPriceKsh: numeric("original_price_ksh", {
      precision: 12,
      scale: 2,
    }),
    memberPriceKsh: numeric("member_price_ksh", {
      precision: 12,
      scale: 2,
    }),
    thumbnail: text("thumbnail"),
    vibeTags: jsonb("vibe_tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    spendingTier: text("spending_tier").notNull().default("standard"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("deal_partner_idx").on(t.partnerId),
    index("deal_active_idx").on(t.active),
  ],
);

export const dateVaultRedemptions = pgTable("date_vault_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => dateVaultDeals.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => matches.id, {
    onDelete: "set null",
  }),
  swipedAt: timestamp("swiped_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  affiliateAttribution: jsonb("affiliate_attribution")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
});

export type DateVaultDeal = typeof dateVaultDeals.$inferSelect;
export type DatePartner = typeof datePartners.$inferSelect;
