import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { zahariEngagementStatusEnum, introductionStatusEnum } from "./enums";

export const zahariEngagements = pgTable(
  "zahari_engagements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    status: zahariEngagementStatusEnum("status")
      .notNull()
      .default("pending_payment"),
    sovereignSearchFeeUsd: numeric("sovereign_search_fee_usd", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("1500"),
    covenantActivationFeeUsd: numeric("covenant_activation_fee_usd", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("1000"),
    sovereignPaidAt: timestamp("sovereign_paid_at", { withTimezone: true }),
    activationPaidAt: timestamp("activation_paid_at", { withTimezone: true }),
    matchmakerUserId: text("matchmaker_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("zahari_eng_status_idx").on(t.status)],
);

export const zahariIntroductions = pgTable(
  "zahari_introductions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => zahariEngagements.id, { onDelete: "cascade" }),
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: introductionStatusEnum("status").notNull().default("presented"),
    presentationSummary: text("presentation_summary"),
    clientResponse: text("client_response"),
    feedback: text("feedback"),
    datePlannedAt: timestamp("date_planned_at", { withTimezone: true }),
    dealId: uuid("deal_id"),
    presentedAt: timestamp("presented_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("zahari_intro_eng_idx").on(t.engagementId),
    index("zahari_intro_status_idx").on(t.status),
  ],
);

export type ZahariEngagement = typeof zahariEngagements.$inferSelect;
export type ZahariIntroduction = typeof zahariIntroductions.$inferSelect;
