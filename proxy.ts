import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = [
  "/profile",
  "/events/me",
  "/matches",
  "/concierge/me",
  "/programs/me",
  "/residential/me",
  "/admin",
  "/partner",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Role gating happens server-side in layout.tsx via requireRole(),
  // since the edge runtime cannot read from the DB.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/webhooks|api/auth|favicon.ico|.*\\..*).*)"],
};
