import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "./session";

const STAFF_ROLES = [
  "admin",
  "super_admin",
  "concierge",
  "facilitator",
  "host",
  "professional",
] as const;

export function isStaffRole(role: string) {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export async function getLatestApplication(userId: string) {
  const [app] = await db
    .select()
    .from(schema.memberApplications)
    .where(eq(schema.memberApplications.userId, userId))
    .orderBy(desc(schema.memberApplications.createdAt))
    .limit(1);
  return app ?? null;
}

export async function requireApprovedMember(opts?: {
  allowPaths?: string[];
}) {
  const user = await requireUser();
  if (isStaffRole(user.role)) return user;

  if (user.vettingStatus === "approved") return user;

  const pathname = opts?.allowPaths?.[0];
  if (user.vettingStatus === "rejected") {
    redirect("/apply/status?state=rejected");
  }
  redirect(pathname ? `/apply/status` : "/apply");
}

export function canAccessEcosystem(user: {
  vettingStatus: string;
  role: string;
}) {
  return user.vettingStatus === "approved" || isStaffRole(user.role);
}

export function isZahariPathway(user: {
  pathway: string | null;
}) {
  return user.pathway === "zahari";
}

export function isAmariPathway(user: {
  pathway: string | null;
}) {
  return user.pathway === "amari";
}
