import "server-only";

import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  formatPersonaAliasDisplay,
  validatePersonaAliasBase,
} from "./persona-alias";

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
