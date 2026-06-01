import { notFound } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveFeedback } from "./actions";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();
  const [m] = await db
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
  if (!m) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Bridge feedback</h1>
        <p className="text-sm text-plum-900/60">
          A private note for the Concierge — helps refine matching.
        </p>
      </header>
      <Card>
        <CardTitle>How did the first date land?</CardTitle>
        <CardSubtitle>
          Only the Concierge sees this. Your match never does.
        </CardSubtitle>
        <form action={saveFeedback} className="mt-4 space-y-3">
          <input type="hidden" name="matchId" value={m.id} />
          <div>
            <Label htmlFor="rating">Rating (1–5)</Label>
            <input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              defaultValue={4}
              className="w-20 rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="body" rows={5} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
