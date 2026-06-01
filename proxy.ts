import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

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

  // Next.js RSC prefetch often omits cookies in production; redirecting here
  // caches a login flight and breaks sidebar navigation for signed-in users.
  const isRouterPrefetch = req.headers.get("Next-Router-Prefetch") === "1";
  if (isRouterPrefetch) {
    // #region agent log
    void fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5e1951",
      },
      body: JSON.stringify({
        sessionId: "5e1951",
        runId: "repro-1",
        hypothesisId: "E",
        location: "proxy.ts:prefetchSkip",
        message: "skipped auth redirect for router prefetch",
        data: { pathname, hasCookie: Boolean(getSessionCookie(req.headers)) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const hasCookie = Boolean(getSessionCookie(req.headers));
  const session = await auth.api.getSession({ headers: req.headers });
  // #region agent log
  void fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "5e1951",
    },
    body: JSON.stringify({
      sessionId: "5e1951",
      runId: "repro-1",
      hypothesisId: "A-D",
      location: "proxy.ts:getSession",
      message: "proxy protected route session check",
      data: {
        pathname,
        hasCookie,
        hasSessionUser: Boolean(session?.user),
        isRsc: req.headers.get("RSC") === "1",
        forwardedProto: req.headers.get("x-forwarded-proto") ?? null,
        host: req.headers.get("host") ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next|api/webhooks|api/auth|api/inngest|favicon.ico|.*\\..*).*)",
  ],
};
