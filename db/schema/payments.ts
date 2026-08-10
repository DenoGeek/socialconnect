import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import {
  paymentCurrencyEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  paymentMethodKindEnum,
} from "./enums";

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: paymentMethodKindEnum("kind").notNull(),
    label: text("label").notNull(),
    mpesaPhone: text("mpesa_phone"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payment_methods_user_idx").on(t.userId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectKind: text("subject_kind").notNull(), // "ticket" | "booking" | "trip" | "professional" | "subscription"
    subjectId: text("subject_id").notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    providerRef: text("provider_ref"),
    senderDisplayName: text("sender_display_name")
      .notNull()
      .default("Evermore"),
    currency: paymentCurrencyEnum("currency").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    rawWebhook: jsonb("raw_webhook")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (t) => [
    index("payments_user_idx").on(t.userId),
    index("payments_status_idx").on(t.status),
    index("payments_subject_idx").on(t.subjectKind, t.subjectId),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
