import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLink } from "@/components/nav/app-link";
import {
  requestCouplesCommunityAccess,
  postCouplesMessage,
} from "./actions";

export default async function CouplesCommunityPage() {
  const user = await requireUser();

  const [membership] = await db
    .select()
    .from(schema.couplesCommunityMembers)
    .where(eq(schema.couplesCommunityMembers.userId, user.id))
    .limit(1);

  const coupleEvents = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.kind, "pulse_retreat"))
    .orderBy(desc(schema.events.startsAt))
    .limit(8);

  // Mutual matches for partner picker (matched couples).
  const matches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.status, "mutual"));
  const myMatches = matches.filter(
    (m) => m.userAId === user.id || m.userBId === user.id,
  );
  const partnerIds = myMatches.map((m) =>
    m.userAId === user.id ? m.userBId : m.userAId,
  );
  const partners =
    partnerIds.length > 0
      ? (await db.select().from(schema.users)).filter((u) =>
          partnerIds.includes(u.id),
        )
      : [];

  const approved = membership?.status === "approved";
  const posts = approved
    ? await db
        .select({
          post: schema.couplesCommunityPosts,
          author: schema.users,
        })
        .from(schema.couplesCommunityPosts)
        .innerJoin(
          schema.users,
          eq(schema.users.id, schema.couplesCommunityPosts.authorUserId),
        )
        .orderBy(desc(schema.couplesCommunityPosts.createdAt))
        .limit(40)
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Couples Communities</h1>
        <p className="text-sm text-plum-900/60 mt-1">
          Forum + couple retreats for matched and married couples after vetting.
        </p>
      </header>

      {!membership && (
        <Card>
          <CardTitle>Request access</CardTitle>
          <CardSubtitle className="mt-1">
            Only matched & married couples may join, after staff vetting.
          </CardSubtitle>
          <form action={requestCouplesCommunityAccess} className="mt-4 space-y-3">
            <select
              name="partnerUserId"
              className="w-full rounded-2xl border px-3 py-2 text-sm"
            >
              <option value="">Partner (from mutual matches)</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button type="submit">Submit for vetting</Button>
          </form>
        </Card>
      )}

      {membership && membership.status !== "approved" && (
        <Card>
          <Badge tone="amber">{membership.status}</Badge>
          <CardTitle className="mt-2">Access pending vetting</CardTitle>
          <CardSubtitle>
            Staff will review your matched/married status before approving community access.
          </CardSubtitle>
        </Card>
      )}

      {approved && (
        <Card>
          <CardTitle>Community forum</CardTitle>
          <form action={postCouplesMessage} className="mt-4 space-y-3">
            <textarea
              name="body"
              required
              placeholder="Share an encouragement or ask the community…"
              className="w-full rounded-2xl border px-3 py-2 text-sm min-h-24"
            />
            <Button type="submit" size="sm">
              Post
            </Button>
          </form>
          <ul className="mt-6 space-y-4">
            {posts.map(({ post, author }) => (
              <li key={post.id} className="border-t border-plum-900/8 pt-3 text-sm">
                <p className="font-medium text-plum-900">{author.name}</p>
                <p className="mt-1 text-plum-900/80 whitespace-pre-wrap">{post.body}</p>
                <p className="mt-1 text-xs text-plum-900/40">
                  {new Date(post.createdAt).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="text-sm text-plum-900/50">No posts yet — start the conversation.</li>
            )}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Couple retreats & events</CardTitle>
        <CardSubtitle className="mt-1">
          Pulse retreats and couple-oriented gatherings.
        </CardSubtitle>
        <ul className="mt-4 divide-y text-sm">
          {coupleEvents.map((e) => (
            <li key={e.id} className="py-3 flex justify-between gap-3">
              <div>
                <p className="font-medium text-plum-900">{e.title}</p>
                <p className="text-xs text-plum-900/50">
                  {e.city ?? "—"} · {new Date(e.startsAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <AppLink href={`/events/${e.slug}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </AppLink>
            </li>
          ))}
          {coupleEvents.length === 0 && (
            <li className="py-2 text-plum-900/50">No couple retreats published yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
