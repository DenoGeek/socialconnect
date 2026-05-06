import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

export const intakeStatusEnum = pgEnum("intake_status", [
  "submitted",
  "in_review",
  "approved",
  "declined",
  "matched",
  "archived",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
]);

// Long-form private intake for Elite ("Silent Match") clients.
export const conciergeIntakes = pgTable(
  "concierge_intakes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: intakeStatusEnum("status").notNull().default("submitted"),
    requirements: jsonb("requirements"), // structured form payload
    budgetKes: integer("budget_kes"),
    timeline: text("timeline"),
    privateNotes: text("private_notes"), // concierge-only notes
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("intake_status_idx").on(t.status)],
);

export const conciergeSubscriptions = pgTable(
  "concierge_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    packageName: text("package_name").notNull(), // "Silent Match", "Curated", "Concierge+"
    priceKes: integer("price_kes").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sub_user_status_idx").on(t.userId, t.status)],
);

export type ConciergeIntake = typeof conciergeIntakes.$inferSelect;
export type ConciergeSubscription = typeof conciergeSubscriptions.$inferSelect;
