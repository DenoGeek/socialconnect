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
import { aliasModeEnum } from "./enums";

// Pool of curated aliases the engine pulls from ("The Alchemist", "The Voyager").
export const aliasPool = pgTable("alias_pool", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  archetype: text("archetype"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One assignment per (user, event). Same user gets the same alias across events
// if `pinned` is set, otherwise the engine rotates them per event.
export const aliasAssignments = pgTable(
  "alias_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    aliasId: uuid("alias_id")
      .notNull()
      .references(() => aliasPool.id, { onDelete: "restrict" }),
    mode: aliasModeEnum("mode").notNull().default("auto"),
    pinned: boolean("pinned").notNull().default(false),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("alias_user_event_uniq").on(t.userId, t.eventId),
    uniqueIndex("alias_event_alias_uniq").on(t.eventId, t.aliasId),
    index("alias_user_idx").on(t.userId),
  ],
);
