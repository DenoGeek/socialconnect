import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export function normalizePersonaAlias(alias: string): string {
  return alias.trim().replace(/\s+/g, " ");
}

/** Strip a trailing #123 suffix if present (legacy or pasted values). */
export function parsePersonaAliasBase(alias: string): string {
  const normalized = normalizePersonaAlias(alias);
  const match = normalized.match(/^(.+?)#\d+$/);
  return match ? match[1].trim() : normalized;
}

export function formatPersonaAliasDisplay(
  base: string | null | undefined,
  code: number | null | undefined,
): string {
  const name = base ? parsePersonaAliasBase(base) : "";
  if (!name) return "—";
  if (code == null) return name;
  return `${name}#${code}`;
}

export async function isPersonaAliasCodeTaken(code: number): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.personaAliasCode, code))
    .limit(1);
  return !!row;
}

/** Pick a random 3-digit code (100–999) not already assigned. */
export async function allocatePersonaAliasCode(): Promise<number> {
  for (let attempt = 0; attempt < 64; attempt++) {
    const code = Math.floor(100 + Math.random() * 900);
    if (!(await isPersonaAliasCodeTaken(code))) return code;
  }

  const [row] = await db
    .select({
      next: sql<number>`coalesce(max(${schema.profiles.personaAliasCode}), 99) + 1`,
    })
    .from(schema.profiles);
  const code = Number(row?.next ?? 100);
  if (code > 999) {
    throw new Error("Persona alias codes are exhausted. Contact support.");
  }
  return code;
}

export function validatePersonaAliasBase(alias: string): string {
  const normalized = parsePersonaAliasBase(alias);
  if (!normalized) {
    throw new Error("Community Alias is required.");
  }
  if (normalized.length < 2) {
    throw new Error("Community Alias must be at least 2 characters.");
  }
  if (normalized.length > 64) {
    throw new Error("Community Alias must be 64 characters or fewer.");
  }
  if (/#\d+$/.test(normalizePersonaAlias(alias))) {
    throw new Error(
      "Enter only your alias name — a unique number is added automatically.",
    );
  }
  return normalized;
}

export async function resolvePersonaAliasForSave(
  base: string,
  existingCode: number | null | undefined,
): Promise<{ base: string; code: number; display: string }> {
  const normalized = validatePersonaAliasBase(base);
  const code =
    existingCode != null ? existingCode : await allocatePersonaAliasCode();
  return {
    base: normalized,
    code,
    display: formatPersonaAliasDisplay(normalized, code),
  };
}
