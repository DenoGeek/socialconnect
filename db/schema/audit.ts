import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    target: text("target"),
    diff: jsonb("diff")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_action_idx").on(t.action),
    index("audit_created_idx").on(t.createdAt),
  ],
);

// Safety/spam reports.
export const userReports = pgTable("user_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: text("reported_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Regional kill switch.
export const regionalKillSwitches = pgTable("regional_kill_switches", {
  id: uuid("id").defaultRandom().primaryKey(),
  region: text("region").notNull().unique(),
  active: boolean("active").notNull().default(false),
  reason: text("reason"),
  toggledByUserId: text("toggled_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  toggledAt: timestamp("toggled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type UserReport = typeof userReports.$inferSelect;
