export function normalizePhone(input: string, country: "KE" = "KE") {
  const digits = input.replace(/[^0-9]/g, "");
  if (country === "KE") {
    if (digits.startsWith("254")) return `+${digits}`;
    if (digits.startsWith("0") && digits.length === 10) {
      return `+254${digits.slice(1)}`;
    }
    if (digits.length === 9) return `+254${digits}`;
  }
  return `+${digits}`;
}
