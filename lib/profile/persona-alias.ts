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
