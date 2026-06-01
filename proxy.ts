import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = [
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
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Router prefetch often omits cookies in production; do not redirect here.
  const isRouterPrefetch = req.headers.get("Next-Router-Prefetch") === "1";
  if (isRouterPrefetch) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Lightweight cookie check only; full session validation runs in layouts/pages.
  const hasCookie = Boolean(getSessionCookie(req.headers));
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next|api/webhooks|api/auth|api/inngest|favicon.ico|.*\\..*).*)",
  ],
};
