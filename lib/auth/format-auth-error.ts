/** Map Better Auth / Zod-style messages to user-friendly copy. */
export function formatAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.trim();

  if (m.includes("[body.email]") || m.toLowerCase().includes("invalid email")) {
    return "Enter a valid email address (e.g. name@example.com).";
  }
  if (m.includes("[body.password]") || m.toLowerCase().includes("password")) {
    return "Password must be at least 8 characters.";
  }
  if (m.toLowerCase().includes("user already exists")) {
    return "An account with this email already exists. Sign in instead.";
  }

  return m.replace(/^\[body\.\w+\]\s*/i, "");
}
