import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ConciergeIndex() {
  const user = await requireUser();

  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.userId, user.id))
    .limit(1);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Concierge</h1>
        <p className="text-sm text-plum-900/60">
          {user.tier === "elite"
            ? "Your direct line. Always responsive, always discrete."
            : "Open a concierge consultation for high-discretion matching."}
        </p>
      </header>

      {user.tier === "elite" ? (
        <Card className={user.tier === "elite" ? "elite-card text-plum-100" : ""}>
          <Badge tone="amber">High priority</Badge>
          <CardTitle className="mt-2 text-plum-100">Your concierge thread</CardTitle>
          <CardSubtitle className="text-plum-100/60">
            {thread?.conciergeOnDuty
              ? "On duty — typically replies within an hour."
              : "Off duty — replies will arrive within 24 hours."}
          </CardSubtitle>
          <Link href="/concierge/thread">
            <Button variant="elite" className="mt-4">
              Open thread
            </Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <CardTitle>Reserve a consultation</CardTitle>
          <CardSubtitle>
            3 fields. No profile required. We&rsquo;ll reach out within 24 hours.
          </CardSubtitle>
          <Link href="/concierge/intake">
            <Button className="mt-4">Reserve</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
