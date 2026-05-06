/**
 * Normalize a Kenyan phone number to 254XXXXXXXXX (12 digits).
 * Accepts 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX.
 */
export function normalizeMsisdn(raw: string): string | null {
  const digits = raw.replace(/\D+/g, "");
  let n = digits;
  if (n.startsWith("0") && n.length === 10) n = `254${n.slice(1)}`;
  if (n.length === 9 && (n.startsWith("7") || n.startsWith("1"))) n = `254${n}`;
  if (!n.startsWith("254") || n.length !== 12) return null;
  return n;
}
