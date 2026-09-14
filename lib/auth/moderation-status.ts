import type { User } from "@/db/schema/identity";

/** Soft suspend: login allowed, ecosystem features blocked, hidden from matching. */
export function isSuspended(user: Pick<User, "suspended">) {
  return Boolean(user.suspended);
}

export function isBanned(user: {
  banned: boolean;
  banExpiresAt?: Date | null;
}) {
  if (!user.banned) return false;
  if (user.banExpiresAt && user.banExpiresAt.getTime() < Date.now()) return false;
  return true;
}

export function canUseEcosystemFeatures(user: {
  banned: boolean;
  banExpiresAt?: Date | null;
  suspended: boolean;
  vettingStatus: string;
  role: string;
}) {
  if (isBanned(user) || isSuspended(user)) return false;
  return user.vettingStatus === "approved";
}
