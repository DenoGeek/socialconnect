import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "partial_refund",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "tinypesa",
  "stripe",
  "flutterwave",
  "manual",
]);

// Provider-agnostic ledger. PaymentProvider implementations write rows here
// with their providerRef (e.g. TinyPesa MerchantRequestID + CheckoutRequestID).
// idempotencyKey lets the application retry initiate() safely.
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    provider: paymentProviderEnum("provider").notNull(),
    providerRef: text("provider_ref"), // composite ref serialized by adapter
    amountMinor: integer("amount_minor").notNull(), // cents/centavos — KES has no minor unit but stay consistent
    currency: text("currency").notNull().default("KES"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    purpose: text("purpose").notNull(), // "ticket" | "booking" | "subscription" | "appointment"
    purposeRef: text("purpose_ref"), // points back to the domain row
    rawCallback: jsonb("raw_callback"), // last webhook payload for debugging
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_idempotency_uniq").on(t.idempotencyKey),
    index("payment_user_status_idx").on(t.userId, t.status),
    index("payment_purpose_idx").on(t.purpose, t.purposeRef),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
