import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "./server";

type UserRole = (typeof schema.userRoleEnum.enumValues)[number];

export async function getSession() {
  const h = await headers();
  return await auth.api.getSession({ headers: h });
}

export async function getCurrentUser() {
  const h = await headers();
  const session = await getSession();
  if (!session?.user) {
    // #region agent log
    void fetch(
      "http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "5e1951",
        },
        body: JSON.stringify({
          sessionId: "5e1951",
          runId: "repro-1",
          hypothesisId: "B",
          location: "session.ts:getCurrentUser:noSession",
          message: "getSession returned no user",
          data: {
            pathname: h.get("x-pathname"),
            isRsc: h.get("RSC") === "1",
            hasCookieHeader: Boolean(h.get("cookie")),
          },
          timestamp: Date.now(),
        }),
      },
    ).catch(() => {});
    // #endregion
    return null;
  }
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  // #region agent log
  void fetch(
    "http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5e1951",
      },
      body: JSON.stringify({
        sessionId: "5e1951",
        runId: "repro-1",
        hypothesisId: "C",
        location: "session.ts:getCurrentUser:dbLookup",
        message: "session user db lookup result",
        data: {
          pathname: h.get("x-pathname"),
          hasDbUser: Boolean(user),
          isRsc: h.get("RSC") === "1",
        },
        timestamp: Date.now(),
      }),
    },
  ).catch(() => {});
  // #endregion
  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const h = await headers();
    const pathname = h.get("x-pathname");
    redirect(
      pathname
        ? `/login?redirect=${encodeURIComponent(pathname)}`
        : "/login",
    );
  }
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireAdmin() {
  return requireRole(["admin", "super_admin", "concierge"]);
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export async function requireFacilitator() {
  return requireRole(["facilitator", "admin", "super_admin"]);
}

export async function requireElite() {
  const user = await requireUser();
  if (user.tier !== "elite") redirect("/");
  return user;
}
