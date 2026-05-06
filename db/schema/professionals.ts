import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

export const professionalKindEnum = pgEnum("professional_kind", [
  "therapist",
  "counsellor",
  "marriage_coach",
  "parental_coach",
  "mediator",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "requested",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const professionals = pgTable(
  "professionals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    kind: professionalKindEnum("kind").notNull(),
    fullName: text("full_name").notNull(),
    headline: text("headline"),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    languages: jsonb("languages").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    specialties: jsonb("specialties").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    sessionFeeKes: integer("session_fee_kes").notNull(),
    sessionMinutes: integer("session_minutes").notNull().default(60),
    location: text("location"),
    virtual: boolean("virtual").notNull().default(true),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prof_kind_published_idx").on(t.kind, t.published)],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    booked: boolean("booked").notNull().default(false),
  },
  (t) => [index("slot_prof_starts_idx").on(t.professionalId, t.startsAt)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "restrict" }),
    clientUserId: text("client_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    slotId: uuid("slot_id").references(() => availabilitySlots.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("requested"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("appt_client_idx").on(t.clientUserId),
    index("appt_prof_starts_idx").on(t.professionalId, t.startsAt),
  ],
);

export type Professional = typeof professionals.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
