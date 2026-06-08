import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isAuthSoftRequest } from "@/lib/auth/request-kind";
import { PROTECTED_PATH_PREFIXES } from "@/lib/nav/protected-paths";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Prefetch/RSC often omits cookies in production; do not 307 (poisons client router).
  if (isAuthSoftRequest(req.headers)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Lightweight cookie check on document navigations; full validation in layouts/pages.
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
