import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reviewModerationItem } from "../ops-actions";

export default async function ModerationPage() {
  await requireAdmin();

  const items = await db
    .select({
      item: schema.moderationItems,
      user: schema.users,
    })
    .from(schema.moderationItems)
    .innerJoin(schema.users, eq(schema.users.id, schema.moderationItems.userId))
    .where(eq(schema.moderationItems.status, "pending"))
    .orderBy(desc(schema.moderationItems.createdAt));

  const pendingProfiles = await db
    .select({
      profile: schema.profiles,
      user: schema.users,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
    .where(eq(schema.profiles.moderationStatus, "pending"))
    .orderBy(desc(schema.profiles.updatedAt))
    .limit(30);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Profile moderation</h1>
        <p className="text-sm text-plum-900/60">
          Review photos, bios, and ID documents for Amari & Zahari. Paste the
          full security protocol doc when available for finer rules.
        </p>
      </header>

      <Card>
        <CardTitle>Moderation queue ({items.length})</CardTitle>
        <ul className="mt-3 space-y-4">
          {items.map(({ item, user }) => (
            <li key={item.id} className="border-t border-plum-900/8 pt-3 text-sm">
              <div className="flex gap-2 items-center">
                <Badge tone="amber">{item.kind}</Badge>
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-plum-900/50">{user.email}</span>
              </div>
              <pre className="mt-2 text-xs bg-plum-900/5 rounded-xl p-3 overflow-auto">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
              <div className="mt-2 flex gap-2">
                <form action={reviewModerationItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={reviewModerationItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-2 text-plum-900/50">Queue empty.</li>
          )}
        </ul>
      </Card>

      <Card>
        <CardTitle>Profiles awaiting moderation status</CardTitle>
        <ul className="mt-3 divide-y text-sm">
          {pendingProfiles.map(({ profile, user }) => (
            <li key={profile.id} className="py-2 flex justify-between gap-3">
              <span>
                {user.name} · {profile.city ?? "—"} · pathway {user.pathway ?? "—"}
              </span>
              <Badge tone="neutral">{profile.moderationStatus}</Badge>
            </li>
          ))}
          {pendingProfiles.length === 0 && (
            <li className="py-2 text-plum-900/50">None pending.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
