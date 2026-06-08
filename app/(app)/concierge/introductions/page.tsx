import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToIntroduction } from "./actions";

export default async function IntroductionsPage() {
  const user = await requireUser();
  if (user.pathway !== "zahari") {
    return (
      <Card>
        <CardTitle>Introductions</CardTitle>
        <CardSubtitle>Available on the Zahari pathway.</CardSubtitle>
      </Card>
    );
  }

  const [eng] = await db
    .select()
    .from(schema.zahariEngagements)
    .where(eq(schema.zahariEngagements.userId, user.id))
    .limit(1);

  const intros = eng
    ? await db
        .select({
          intro: schema.zahariIntroductions,
          candidate: schema.users,
        })
        .from(schema.zahariIntroductions)
        .innerJoin(
          schema.users,
          eq(schema.users.id, schema.zahariIntroductions.candidateUserId),
        )
        .where(eq(schema.zahariIntroductions.engagementId, eng.id))
    : [];

  return (
    <div className="space-y-6">
      <header className="elite-page-header">
        <h1 className="text-display text-3xl">Candidate presentations</h1>
        <p className="text-sm opacity-70">
          Your matchmaker introduces aligned candidates — accept or decline prayerfully.
        </p>
      </header>

      {intros.length === 0 && (
        <Card>
          <CardTitle>No presentations yet</CardTitle>
          <CardSubtitle>
            Your concierge is curating your first introduction.
          </CardSubtitle>
        </Card>
      )}

      {intros.map(({ intro, candidate }) => (
        <Card key={intro.id}>
          <Badge tone="amber">{intro.status}</Badge>
          <CardTitle className="mt-2">{candidate.name}</CardTitle>
          <CardSubtitle className="mt-2 whitespace-pre-line">
            {intro.presentationSummary ?? "Profile pack shared by your matchmaker."}
          </CardSubtitle>
          {intro.status === "presented" && (
            <div className="mt-4 flex gap-2">
              <form action={respondToIntroduction}>
                <input type="hidden" name="introId" value={intro.id} />
                <input type="hidden" name="response" value="accepted" />
                <Button type="submit" size="sm">
                  Accept introduction
                </Button>
              </form>
              <form action={respondToIntroduction}>
                <input type="hidden" name="introId" value={intro.id} />
                <input type="hidden" name="response" value="declined" />
                <Button type="submit" variant="ghost" size="sm">
                  Decline
                </Button>
              </form>
            </div>
          )}
          {intro.status === "accepted" && (
            <form action={respondToIntroduction} className="mt-4 space-y-2">
              <input type="hidden" name="introId" value={intro.id} />
              <input type="hidden" name="response" value="feedback" />
              <Textarea
                name="feedback"
                placeholder="How did your introduction go?"
                rows={3}
              />
              <Button type="submit" variant="outline" size="sm">
                Submit feedback
              </Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
