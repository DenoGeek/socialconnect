import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy-initialized DB. We don't want to throw on module load because:
 *   1. `next build` collects route metadata by importing every server module
 *      and would crash without DATABASE_URL set, even though we never run a query.
 *   2. Type-checking and tree-shaking should work without secrets.
 *
 * The actual postgres client + drizzle instance are constructed on first
 * property access via the Proxy below, and cached for subsequent calls.
 */

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

function init(): DrizzleClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 1,
  });
  return drizzle(client, { schema, casing: "snake_case" });
}

export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    if (!cached) cached = init();
    return Reflect.get(cached as object, prop, receiver);
  },
});

export type DB = DrizzleClient;
export { schema };
