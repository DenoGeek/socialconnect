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
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { payments } from "./payments";

export const propertyStatusEnum = pgEnum("property_status", [
  "draft",
  "published",
  "paused",
  "removed",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const certificationStatusEnum = pgEnum("certification_status", [
  "pending",
  "in_review",
  "certified",
  "denied",
]);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hostId: text("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    type: text("type").notNull(), // "rustic", "modern-rustic", "villa", "boutique"
    city: text("city").notNull(),
    country: text("country").notNull().default("KE"),
    address: text("address"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    basePriceKes: integer("base_price_kes").notNull(),
    cleaningFeeKes: integer("cleaning_fee_kes").notNull().default(0),
    maxGuests: integer("max_guests").notNull().default(2),
    bedrooms: integer("bedrooms").notNull().default(1),
    photos: jsonb("photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    amenities: jsonb("amenities").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    status: propertyStatusEnum("status").notNull().default("draft"),
    aganoCertified: boolean("agano_certified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("property_host_idx").on(t.hostId),
    index("property_city_status_idx").on(t.city, t.status),
  ],
);

// Day-level availability/blocks. Booking creation atomically inserts rows here
// inside a transaction to enforce non-overlap (one row per (property, date)).
export const propertyAvailability = pgTable(
  "property_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    bookingId: uuid("booking_id"), // null if blocked by host (off-market day)
    blockedReason: text("blocked_reason"),
  },
  (t) => [
    uniqueIndex("availability_property_day_uniq").on(t.propertyId, t.day),
    index("availability_booking_idx").on(t.bookingId),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "restrict" }),
    guestUserId: text("guest_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    nights: integer("nights").notNull(),
    guests: integer("guests").notNull().default(2),
    totalKes: integer("total_kes").notNull(),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("booking_guest_idx").on(t.guestUserId),
    index("booking_property_status_idx").on(t.propertyId, t.status),
  ],
);

export const tripPackages = pgTable(
  "trip_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    durationDays: integer("duration_days").notNull(),
    priceKes: integer("price_kes").notNull(),
    propertyIds: jsonb("property_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    itinerary: jsonb("itinerary"),
    coverImageUrl: text("cover_image_url"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

// Date Vault — curated date ideas + partner perks.
export const partnerLocations = pgTable(
  "partner_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(), // "restaurant" | "spa" | "hotel" | "activity"
    city: text("city").notNull(),
    address: text("address"),
    description: text("description"),
    photoUrl: text("photo_url"),
    discountCode: text("discount_code"),
    discountPercent: integer("discount_percent"),
    bookingUrl: text("booking_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("partner_loc_city_cat_idx").on(t.city, t.category)],
);

export const dateIdeas = pgTable(
  "date_ideas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    city: text("city"),
    budgetTier: text("budget_tier"), // "shoestring" | "mid" | "splurge"
    vibe: text("vibe"),
    partnerLocationId: uuid("partner_location_id").references(() => partnerLocations.id, { onDelete: "set null" }),
    coverImageUrl: text("cover_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("date_ideas_city_idx").on(t.city)],
);

export const aganoCertifications = pgTable(
  "agano_certifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    submittedBy: text("submitted_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: certificationStatusEnum("status").notNull().default("pending"),
    application: jsonb("application"),
    reviewerNotes: text("reviewer_notes"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export type Property = typeof properties.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type DateIdea = typeof dateIdeas.$inferSelect;
