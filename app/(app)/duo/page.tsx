import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSyncInvite, acceptSync, desync } from "./actions";

export default async function DuoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  // Active sync, if any.
  const [active] = await db
    .select()
    .from(schema.duoSyncs)
    .where(
      or(
        eq(schema.duoSyncs.initiatorUserId, user.id),
        eq(schema.duoSyncs.inviteeUserId, user.id),
      ),
    )
    .limit(1);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Duo-Account Sync</h1>
        <p className="text-sm text-plum-900/60">
          Pair two Evermore accounts into one shared Agano dashboard.
        </p>
      </header>

      {active ? (
        <Card>
          <Badge tone={active.status === "active" ? "mint" : "neutral"}>
            {active.status}
          </Badge>
          <CardTitle className="mt-2">Your sync</CardTitle>
          <CardSubtitle>
            {active.status === "invited"
              ? "Waiting on your partner to accept."
              : active.status === "active"
                ? "You're synced. Hearth & Programs are now joint."
                : "Sync has been ended."}
          </CardSubtitle>
          {active.status === "invited" &&
            active.initiatorUserId === user.id && (
              <div className="mt-4">
                <p className="text-sm text-plum-900/70">
                  Share this invite link with your partner:
                </p>
                <code className="block mt-2 break-all rounded-xl bg-plum-900/5 p-3 text-xs">
                  /duo?token={active.inviteToken}
                </code>
              </div>
            )}
          {active.status !== "desynced" && (
            <form action={desync} className="mt-4">
              <input type="hidden" name="duoId" value={active.id} />
              <Button variant="danger" type="submit">
                De-sync
              </Button>
            </form>
          )}
        </Card>
      ) : sp.token ? (
        <Card>
          <CardTitle>Accept sync invite?</CardTitle>
          <CardSubtitle>
            Your partner invited you. Once accepted, past match history stays
            archived & private.
          </CardSubtitle>
          <form action={acceptSync} className="mt-4">
            <input type="hidden" name="token" value={sp.token} />
            <Button type="submit">Accept and sync</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <CardTitle>Invite your partner</CardTitle>
          <CardSubtitle>
            We&rsquo;ll generate a link they can open while signed in.
          </CardSubtitle>
          <form action={createSyncInvite} className="mt-4 space-y-3">
            <input
              type="email"
              name="email"
              placeholder="Their email"
              required
              className="w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2.5 text-sm"
            />
            <Button type="submit">Generate sync link</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
