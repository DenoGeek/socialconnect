import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { propertyTypeEnum, bookingStatusEnum, tripScopeEnum } from "./enums";

// Hosts (own + verified external).
export const hosts = pgTable("hosts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  legalName: text("legal_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  payoutAccount: text("payout_account"),
  certifiedAt: timestamp("certified_at", { withTimezone: true }),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const hearthProperties = pgTable(
  "hearth_properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => hosts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    propertyType: propertyTypeEnum("property_type").notNull(),
    description: text("description"),
    region: text("region"),
    city: text("city"),
    country: text("country").notNull().default("KE"),
    lat: numeric("lat", { precision: 10, scale: 6 }),
    lng: numeric("lng", { precision: 10, scale: 6 }),
    gallery: jsonb("gallery")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    amenities: jsonb("amenities")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    nightlyRateKsh: numeric("nightly_rate_ksh", {
      precision: 12,
      scale: 2,
    }).notNull(),
    nightlyRateUsd: numeric("nightly_rate_usd", {
      precision: 12,
      scale: 2,
    }).notNull(),
    aganoCertified: boolean("agano_certified").notNull().default(false),
    connectionBoxIncluded: boolean("connection_box_included")
      .notNull()
      .default(false),
    minNights: integer("min_nights").notNull().default(1),
    maxOccupancy: integer("max_occupancy").notNull().default(2),
    landmarkTags: jsonb("landmark_tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    isElitePrivate: boolean("is_elite_private").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("hearth_region_idx").on(t.region),
    index("hearth_certified_idx").on(t.aganoCertified),
  ],
);

export const propertyAddOns = pgTable("property_add_ons", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => hearthProperties.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Firewood Bundle", "Breakfast Basket", "Late Checkout"
  priceKsh: numeric("price_ksh", { precision: 12, scale: 2 }).notNull(),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
});

export const hearthBookings = pgTable(
  "hearth_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => hearthProperties.id, { onDelete: "restrict" }),
    primaryUserId: text("primary_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerUserId: text("partner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    rooms: integer("rooms").notNull().default(1),
    adults: integer("adults").notNull().default(2),
    children: integer("children").notNull().default(0),
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
    currency: text("currency").notNull().default("KSH"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    addOns: jsonb("add_ons")
      .$type<Array<{ id: string; name: string; price: number }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    keyCode: text("key_code"),
    keyCodeIssuedAt: timestamp("key_code_issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("booking_property_idx").on(t.propertyId),
    index("booking_dates_idx").on(t.checkIn, t.checkOut),
    index("booking_status_idx").on(t.status),
  ],
);

// Property reviews + host response.
export const propertyReviews = pgTable("property_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => hearthProperties.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => hearthBookings.id, {
    onDelete: "set null",
  }),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  body: text("body"),
  hostResponse: text("host_response"),
  hostRespondedAt: timestamp("host_responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Trip packages (bespoke / group).
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  scope: tripScopeEnum("scope").notNull(),
  region: text("region"),
  facilitatorIncluded: boolean("facilitator_included")
    .notNull()
    .default(false),
  curriculumIncluded: boolean("curriculum_included").notNull().default(false),
  startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
  endsOn: timestamp("ends_on", { withTimezone: true }).notNull(),
  totalKsh: numeric("total_ksh", { precision: 12, scale: 2 }).notNull(),
  totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),
  inclusiveDescription: text("inclusive_description"),
  gallery: jsonb("gallery")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  capacity: integer("capacity").notNull().default(10),
  active: boolean("active").notNull().default(true),
});

export const tripBookings = pgTable(
  "trip_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    primaryUserId: text("primary_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    partnerUserId: text("partner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    installmentMonths: integer("installment_months").notNull().default(1),
    currency: text("currency").notNull().default("USD"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    documentsUploaded: jsonb("documents_uploaded")
      .$type<Array<{ kind: string; url: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("trip_booking_user_idx").on(t.primaryUserId)],
);

export const tripInstallments = pgTable(
  "trip_installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => tripBookings.id, { onDelete: "cascade" }),
    dueOn: timestamp("due_on", { withTimezone: true }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("installment_booking_due_uniq").on(t.bookingId, t.dueOn)],
);

// B2B licensing application.
export const licensingApplications = pgTable("licensing_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicantUserId: text("applicant_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  propertyName: text("property_name").notNull(),
  photos: jsonb("photos")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  complianceChecklist: jsonb("compliance_checklist")
    .$type<Record<string, boolean>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  status: text("status").notNull().default("submitted"),
  licensingFeePct: integer("licensing_fee_pct").notNull().default(15),
  reviewerUserId: text("reviewer_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type HearthProperty = typeof hearthProperties.$inferSelect;
export type HearthBooking = typeof hearthBookings.$inferSelect;
export type Trip = typeof trips.$inferSelect;
