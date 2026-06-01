type HeaderSource = { get(name: string): string | null };

/** Next.js router prefetch (often sent without cookies in production). */
export function isRouterPrefetchRequest(h: HeaderSource): boolean {
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("Next-Router-Prefetch") === "1"
  );
}

/** React Server Components flight for client-side navigations. */
export function isRscRequest(h: HeaderSource): boolean {
  return h.get("rsc") === "1";
}

/**
 * Prefetch/RSC requests must not receive HTTP 307 login redirects — the router
 * caches them and shows /login even when the session cookie is valid.
 */
export function isAuthSoftRequest(h: HeaderSource): boolean {
  return isRouterPrefetchRequest(h) || isRscRequest(h);
}

/** Full document loads (send cookies reliably behind Cloudflare). */
export function isDocumentNavigation(h: HeaderSource): boolean {
  const mode = h.get("sec-fetch-mode");
  return mode === "navigate" || mode === null;
}
