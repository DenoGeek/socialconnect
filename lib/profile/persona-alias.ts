import { and, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export function normalizePersonaAlias(alias: string): string {
  return alias.trim().replace(/\s+/g, " ");
}

export async function isPersonaAliasTaken(
  alias: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = normalizePersonaAlias(alias);
  if (!normalized) return false;

  const conditions = [
    sql`lower(${schema.profiles.personaAlias}) = lower(${normalized})`,
  ];
  if (excludeUserId) {
    conditions.push(ne(schema.profiles.userId, excludeUserId));
  }

  const [row] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(and(...conditions))
    .limit(1);
  return !!row;
}

export async function assertPersonaAliasAvailable(
  alias: string,
  excludeUserId?: string,
): Promise<string> {
  const normalized = normalizePersonaAlias(alias);
  if (!normalized) {
    throw new Error("Community Alias is required.");
  }
  if (normalized.length < 2) {
    throw new Error("Community Alias must be at least 2 characters.");
  }
  if (normalized.length > 64) {
    throw new Error("Community Alias must be 64 characters or fewer.");
  }
  if (await isPersonaAliasTaken(normalized, excludeUserId)) {
    throw new Error(
      "This Community Alias is already taken. Please choose another.",
    );
  }
  return normalized;
}
