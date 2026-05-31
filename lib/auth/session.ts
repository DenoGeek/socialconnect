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
  const session = await getSession();
  if (!session?.user) return null;
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
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
