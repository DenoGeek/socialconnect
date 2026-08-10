import { AppLink } from "@/components/nav/app-link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";
import { MatchChat } from "./match-chat";

export default async function MatchDetail({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();
  const [match] = await db
    .select()
    .from(schema.matches)
    .where(
      and(
        eq(schema.matches.id, matchId),
        or(
          eq(schema.matches.userAId, user.id),
          eq(schema.matches.userBId, user.id),
        ),
      ),
    )
    .limit(1);
  if (!match) notFound();

  const isMutual = match.status === "mutual";
  const otherUserId =
    match.userAId === user.id ? match.userBId : match.userAId;
  const [other] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, otherUserId))
    .limit(1);
  const [otherUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, otherUserId))
    .limit(1);

  const upsells = await db
    .select({
      upsell: schema.matchBridgeUpsells,
      deal: schema.dateVaultDeals,
      partner: schema.datePartners,
    })
    .from(schema.matchBridgeUpsells)
    .leftJoin(
      schema.dateVaultDeals,
      eq(schema.dateVaultDeals.id, schema.matchBridgeUpsells.dealId),
    )
    .leftJoin(
      schema.datePartners,
      eq(schema.datePartners.id, schema.dateVaultDeals.partnerId),
    )
    .where(eq(schema.matchBridgeUpsells.matchId, match.id));

  const messages = isMutual
    ? await db
        .select()
        .from(schema.matchMessages)
        .where(eq(schema.matchMessages.matchId, match.id))
        .orderBy(asc(schema.matchMessages.createdAt))
    : [];

  const [me] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);
  const triggerAscent =
    (me?.intentBadges ?? []).includes("ready_for_covenant") &&
    (other?.intentBadges ?? []).includes("ready_for_covenant");

  return (
    <article className="space-y-6 max-w-2xl">
      <header>
        <Badge tone="mint">
          {isMutual ? "Mutual match · profiles unlocked" : match.status}
        </Badge>
        <h1 className="text-display text-3xl text-plum-900 mt-2">
          You & {otherUser?.name ?? "your match"}
        </h1>
        <p className="text-sm text-plum-900/60">
          Compatibility {match.compatibilityScore ?? "—"}/100 ·{" "}
          {match.sharedIntents.length} shared intent(s)
        </p>
      </header>

      {isMutual ? (
        <Card>
          <CardTitle>{otherUser?.name ?? "Your match"}</CardTitle>
          <CardSubtitle>{other?.city ?? "—"}</CardSubtitle>
          {other?.bio && (
            <p className="mt-3 text-sm text-plum-900/80 whitespace-pre-line">
              {other.bio}
            </p>
          )}
          {other?.dreamDate && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-plum-900/50 mb-1">
                Their dream date
              </p>
              <p className="text-sm text-plum-900/80">{other.dreamDate}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {(other?.intentBadges ?? []).map((b) => (
              <Badge key={b} tone="plum">
                {b.replaceAll("_", " ")}
              </Badge>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>Waiting on mutual choice</CardTitle>
          <CardSubtitle>
            Chat and full profiles open only after you both choose each other in post-event feedback.
          </CardSubtitle>
        </Card>
      )}

      {isMutual && (
        <Card>
          <CardTitle>Conversation</CardTitle>
          <CardSubtitle className="mb-4">
            Unlocked because you mutually chose to go forward after the event.
          </CardSubtitle>
          <MatchChat
            matchId={match.id}
            currentUserId={user.id}
            messages={messages}
          />
        </Card>
      )}

      {isMutual && upsells.length === 0 && (
        <Card>
          <CardTitle>Date packages & ideas</CardTitle>
          <CardSubtitle>
            Browse curated date experiences for your next step together.
          </CardSubtitle>
          <AppLink href="/date-vault" className="block mt-4">
            <Button>Open Date Vault</Button>
          </AppLink>
        </Card>
      )}

      {isMutual &&
        upsells.map((u, i) =>
          u.deal && u.partner ? (
            <Card key={u.upsell.id} className="border-plum-900/20">
              <Badge tone="amber">Date package · suggestion {i + 1}</Badge>
              <CardTitle className="mt-2">{u.deal.title}</CardTitle>
              <CardSubtitle>
                {u.partner.name} · {u.partner.city ?? "—"}
              </CardSubtitle>
              {u.deal.description && (
                <p className="text-sm text-plum-900/70 mt-2">
                  {u.deal.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-sm">
                {u.deal.originalPriceKsh && (
                  <span className="line-through text-plum-900/40">
                    {formatMoney(u.deal.originalPriceKsh, "KSH")}
                  </span>
                )}
                {u.deal.memberPriceKsh && (
                  <span className="text-plum-900 font-medium">
                    {formatMoney(u.deal.memberPriceKsh, "KSH")} (Agano member)
                  </span>
                )}
                {u.deal.discountCode && (
                  <Badge tone="teal">Code: {u.deal.discountCode}</Badge>
                )}
              </div>
              <AppLink href={`/date-vault/${u.deal.id}/redeem?matchId=${match.id}`}>
                <Button className="mt-4">Swipe to redeem</Button>
              </AppLink>
              <p className="text-xs text-plum-900/40 mt-3">
                {u.upsell.reasoning}
              </p>
            </Card>
          ) : null,
        )}

      {triggerAscent && (
        <Card className="bg-amber-soft border border-amber">
          <Badge tone="amber">Ascent triggered</Badge>
          <CardTitle className="mt-2">
            Both of you are Ready for Covenant.
          </CardTitle>
          <CardSubtitle>
            The Agano Ascent pre-marital course is ready when you are.
          </CardSubtitle>
          <AppLink href="/programs?kind=agano_ascent">
            <Button className="mt-4">Explore Ascent</Button>
          </AppLink>
        </Card>
      )}
    </article>
  );
}
