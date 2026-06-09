import { AppLink } from "@/components/nav/app-link";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getProfileProgressLabel } from "@/lib/profile/onboarding-status";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";

  let users = await db
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.userId, schema.users.id),
    )
    .where(
      q
        ? or(
            ilike(schema.users.name, `%${q}%`),
            ilike(schema.users.email, `%${q}%`),
            ilike(schema.profiles.phone, `%${q}%`),
          )
        : sql`true`,
    )
    .orderBy(desc(schema.users.createdAt))
    .limit(100);

  // Role-based: Facilitator can't see Elite tier users.
  if (me.role === "facilitator") {
    users = users.filter((u) => u.user.tier !== "elite");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Users</h1>
        <p className="text-sm text-plum-900/60">
          Search by name, email, or phone. See where each member is in profile
          creation and open their full profile.
        </p>
      </header>

      <form className="max-w-md">
        <Input name="q" defaultValue={q} placeholder="Search users…" />
      </form>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Profile</th>
              <th>Vetting</th>
              <th>Tier</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {users.map(({ user, profile }) => (
              <tr key={user.id}>
                <td className="py-3">{user.name}</td>
                <td className="text-plum-900/70">{user.email}</td>
                <td>
                  <Badge tone="neutral">{user.role.replace("_", " ")}</Badge>
                </td>
                <td>
                  <Badge
                    tone={profile?.onboardingCompletedAt ? "mint" : "amber"}
                  >
                    {getProfileProgressLabel(profile)}
                  </Badge>
                </td>
                <td>
                  <Badge tone="neutral">{user.vettingStatus}</Badge>
                </td>
                <td>
                  <Badge
                    tone={user.tier === "elite" ? "amber" : "neutral"}
                  >
                    {user.tier}
                  </Badge>
                  {profile?.flaggedForReview && (
                    <Badge tone="amber" className="ml-1">
                      Flagged
                    </Badge>
                  )}
                </td>
                <td>
                  <AppLink
                    href={`/admin/users/${user.id}`}
                    className="text-xs underline text-plum-900"
                  >
                    Open →
                  </AppLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
