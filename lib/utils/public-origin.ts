/**
 * Public site origin behind reverse proxies (Cloudflare Tunnel, Dokploy).
 * Next's standalone server uses HOSTNAME=0.0.0.0:3000 internally, so
 * `new URL("/", req.url)` produces broken redirects in production.
 */
export function getPublicOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : "https";
    return `${proto}://${forwardedHost}`;
  }

  for (const raw of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  ]) {
    if (!raw) continue;
    try {
      return new URL(raw).origin;
    } catch {
      /* ignore */
    }
  }

  return new URL(req.url).origin;
}
