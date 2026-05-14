import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

export const professionals = pgTable(
  "professionals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    specialties: jsonb("specialties")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`), // "communication" | "parenting" | "finances"
    bio: text("bio"),
    photoUrl: text("photo_url"),
    teleHealthEnabled: boolean("tele_health_enabled").notNull().default(true),
    city: text("city"),
    rate: integer("rate"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("prof_active_idx").on(t.active)],
);

export const professionalAvailability = pgTable("professional_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionals.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  booked: boolean("booked").notNull().default(false),
});

export const professionalBookings = pgTable("professional_bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionals.id, { onDelete: "cascade" }),
  availabilityId: uuid("availability_id").references(
    () => professionalAvailability.id,
    { onDelete: "set null" },
  ),
  primaryUserId: text("primary_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  partnerUserId: text("partner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  videoLink: text("video_link"),
  paymentConfirmedAt: timestamp("payment_confirmed_at", { withTimezone: true }),
  sessionStartedAt: timestamp("session_started_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const professionalQuickChats = pgTable("professional_quick_chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionals.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  reply: text("reply"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Professional = typeof professionals.$inferSelect;
