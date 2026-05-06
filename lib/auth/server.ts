import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./index";

export type Role = "user" | "concierge" | "admin" | "partner" | "host" | "professional";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  const role = (session.user.role ?? "user") as Role;
  if (!allowed.includes(role)) {
    redirect("/");
  }
  return session;
}
