import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { events } from "./events";

// Curated pool of mystique aliases ("The Alchemist", "The Mariner", ...).
// Admin manages the pool; per-event assignments draw from active entries.
export const aliasPool = pgTable("alias_pool", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per (event, user) — guarantees the alias is unique within an event.
export const aliasAssignments = pgTable(
  "alias_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    aliasId: uuid("alias_id").notNull().references(() => aliasPool.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("alias_event_user_uniq").on(t.eventId, t.userId),
    uniqueIndex("alias_event_alias_uniq").on(t.eventId, t.aliasId),
    index("alias_user_idx").on(t.userId),
  ],
);

export type AliasPoolEntry = typeof aliasPool.$inferSelect;
export type AliasAssignment = typeof aliasAssignments.$inferSelect;
