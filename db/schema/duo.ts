import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { duoStatusEnum } from "./enums";

// Duo-Account Sync: pairing two explorers into a couple dashboard.
export const duoSyncs = pgTable(
  "duo_syncs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    initiatorUserId: text("initiator_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteeUserId: text("invitee_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    inviteeEmail: text("invitee_email"),
    inviteToken: text("invite_token").notNull().unique(),
    status: duoStatusEnum("status").notNull().default("invited"),
    sharedBillingMethod: text("shared_billing_method"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    desyncedAt: timestamp("desynced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("duo_users_uniq").on(t.initiatorUserId, t.inviteeUserId)],
);

export type DuoSync = typeof duoSyncs.$inferSelect;
