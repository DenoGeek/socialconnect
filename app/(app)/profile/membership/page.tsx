import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Legacy route — hub lives at /account. */
export default async function MembershipPage() {
  const user = await requireUser();

  if (user.pathway === "amari") {
    return (
      <div className="max-w-md space-y-4">
        <header>
          <h1 className="text-display text-3xl text-plum-900">Amari Fellowship</h1>
          <Badge tone="mint" className="mt-2">
            Complimentary entry
          </Badge>
        </header>
        <Card>
          <CardTitle>Your pathway is active</CardTitle>
          <CardSubtitle>
            Amari includes community access, events (tickets purchased separately),
            Match Cards, and complimentary mutual match coordination.
          </CardSubtitle>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/events">
              <Button>Browse Pulse Hub</Button>
            </Link>
            <Link href="/account">
              <Button variant="outline">Account & billing</Button>
            </Link>
            <Link href="/apply/zahari">
              <Button variant="outline">Upgrade to Zahari</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (user.pathway === "zahari") {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, user.id))
      .limit(1);
    if (eng?.status === "pending_payment" || eng?.sovereignPaidAt) {
      redirect("/concierge/zahari/pay");
    }
    redirect("/apply/status");
  }

  redirect("/apply");
}
