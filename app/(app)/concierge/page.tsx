import { AppLink } from "@/components/nav/app-link";
import { eq, asc, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, isEliteExperience, isZahariPathway } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConciergeChat } from "@/components/concierge/concierge-chat";
import { UpgradeToZahariBanner } from "@/components/membership/upgrade-to-zahari";

export default async function ConciergeIndex() {
  const user = await requireUser();
  const elite = isEliteExperience(user);
  const zahari = isZahariPathway(user);

  let [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.userId, user.id))
    .limit(1);

  if (elite && !thread) {
    [thread] = await db
      .insert(schema.conciergeThreads)
      .values({ userId: user.id })
      .returning();
  }

  const messages = thread
    ? await db
        .select()
        .from(schema.conciergeMessages)
        .where(eq(schema.conciergeMessages.threadId, thread.id))
        .orderBy(asc(schema.conciergeMessages.createdAt))
    : [];

  const [eng] = zahari
    ? await db
        .select()
        .from(schema.zahariEngagements)
        .where(eq(schema.zahariEngagements.userId, user.id))
        .limit(1)
    : [null];

  const matchmaker = eng?.matchmakerUserId
    ? await db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, eng.matchmakerUserId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const introCount = eng
    ? await db
        .select({ value: count() })
        .from(schema.zahariIntroductions)
        .where(eq(schema.zahariIntroductions.engagementId, eng.id))
        .then((r) => Number(r[0]?.value ?? 0))
    : 0;

  const headerClass = elite ? "elite-page-header" : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <header className={headerClass}>
        <h1 className="text-display text-3xl">Concierge</h1>
        <p className="text-sm opacity-70">
          {elite
            ? "Your direct line. Always responsive, always discrete."
            : "Open a concierge consultation for high-discretion matching."}
        </p>
      </header>

      {zahari && eng && (
        <Card className="elite-card">
          <div className="flex flex-wrap gap-2">
            <Badge tone="amber">{eng.status}</Badge>
            {!eng.sovereignPaidAt && <Badge tone="neutral">Fee pending</Badge>}
          </div>
          <CardTitle className="mt-2">Your Zahari engagement</CardTitle>
          <CardSubtitle className="mt-2 space-y-1">
            {matchmaker && <p>Matchmaker: {matchmaker.name}</p>}
            <p>
              Introductions presented: {introCount}
            </p>
            <p>
              Sovereign fee:{" "}
              {eng.sovereignPaidAt
                ? `Paid ${new Date(eng.sovereignPaidAt).toLocaleDateString("en-GB")}`
                : "Outstanding"}
            </p>
          </CardSubtitle>
          {!eng.sovereignPaidAt && (
            <AppLink href="/concierge/zahari/pay">
              <Button variant="elite" className="mt-4" size="sm">
                Pay sovereign fee
              </Button>
            </AppLink>
          )}
          <AppLink
            href="/concierge/introductions"
            className="block mt-3 text-sm underline opacity-80"
          >
            View candidate presentations →
          </AppLink>
        </Card>
      )}

      {user.tier === "elite" && user.pathway === "amari" && (
        <UpgradeToZahariBanner />
      )}

      {elite && thread ? (
        <Card className={elite ? "elite-card" : ""}>
          <CardTitle className={elite ? "" : ""}>
            {zahari ? "Your matchmaker" : "Your concierge thread"}
          </CardTitle>
          <CardSubtitle className={elite ? "opacity-70" : ""}>
            {thread.conciergeOnDuty
              ? "On duty — typically replies within an hour."
              : "Off duty — replies will arrive within 24 hours."}
          </CardSubtitle>
          <div className="mt-4">
            <ConciergeChat
              threadId={thread.id}
              userId={user.id}
              initialMessages={messages.map((m) => ({
                id: m.id,
                senderUserId: m.senderUserId,
                body: m.body,
                priority: m.priority,
                attachments: m.attachments,
                createdAt: m.createdAt.toISOString(),
              }))}
              conciergeOnDuty={thread.conciergeOnDuty}
              elite={elite}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>Reserve a consultation</CardTitle>
          <CardSubtitle>
            3 fields. No profile required. We&rsquo;ll reach out within 24 hours.
          </CardSubtitle>
          <AppLink href="/concierge/intake">
            <Button className="mt-4">Reserve</Button>
          </AppLink>
        </Card>
      )}
    </div>
  );
}
