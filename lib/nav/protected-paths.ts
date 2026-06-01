/** Must stay in sync with middleware auth gating. */
export const PROTECTED_PATH_PREFIXES = [
  "/profile",
  "/events",
  "/events/me",
  "/matches",
  "/concierge",
  "/programs",
  "/residential",
  "/professionals",
  "/trips",
  "/duo",
  "/date-vault",
  "/admin",
  "/facilitator",
] as const;

export function isProtectedHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
