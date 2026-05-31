/** Suggested platform nicknames (display names) — not legal names. */
export const DISPLAY_NAME_SUGGESTIONS = [
  "The Alchemist",
  "The Voyager",
  "The Cartographer",
  "The Architect",
  "The Curator",
  "The Composer",
  "The Pilgrim",
  "The Storyteller",
  "The Gardener",
  "The Navigator",
  "The Lantern",
  "The Wayfarer",
  "The Quiet Oak",
  "Golden Hour",
  "Covenant Seeker",
  "Slow Burn",
  "Nairobi Dreamer",
  "Highlands Heart",
  "Faithful Steps",
  "Iron & Grace",
];

export function suggestDisplayNames(seed?: string, count = 6): string[] {
  const base = DISPLAY_NAME_SUGGESTIONS;
  if (!seed?.trim()) {
    return base.slice(0, count);
  }
  const s = seed.trim().toLowerCase();
  const scored = base.map((name) => {
    const n = name.toLowerCase();
    let score = 0;
    if (n.includes(s.split(" ")[0] ?? "")) score += 2;
    for (const part of s.split(/\s+/)) {
      if (part.length > 2 && n.includes(part)) score += 1;
    }
    return { name, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((x) => x.score > 0).map((x) => x.name);
  const rest = base.filter((n) => !picked.includes(n));
  return [...picked, ...rest].slice(0, count);
}
