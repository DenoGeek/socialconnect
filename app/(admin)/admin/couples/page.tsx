import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { vetCouplesMember } from "@/app/(app)/couples/actions";

export default async function AdminCouplesPage() {
  await requireAdmin();

  const pending = await db
    .select({
      member: schema.couplesCommunityMembers,
      user: schema.users,
    })
    .from(schema.couplesCommunityMembers)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.couplesCommunityMembers.userId),
    )
    .where(eq(schema.couplesCommunityMembers.status, "pending"))
    .orderBy(desc(schema.couplesCommunityMembers.createdAt));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Couples community vetting</h1>
        <p className="text-sm text-plum-900/60">
          Approve only matched & married couples.
        </p>
      </header>

      <Card>
        <CardTitle>Pending ({pending.length})</CardTitle>
        <ul className="mt-3 space-y-3 text-sm">
          {pending.map(({ member, user }) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-plum-900/50">{user.email}</p>
                <Badge tone="amber" className="mt-1">
                  {member.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <form action={vetCouplesMember}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={vetCouplesMember}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </li>
          ))}
          {pending.length === 0 && (
            <li className="py-2 text-plum-900/50">No pending requests.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
