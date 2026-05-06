import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

// Append-only audit log for admin/concierge actions. Used for trust + traceability.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // "match.handoff", "intake.approve", "partner.suspend", ...
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId, t.createdAt),
    index("audit_resource_idx").on(t.resourceType, t.resourceId),
  ],
);

export type AuditEntry = typeof auditLog.$inferSelect;
