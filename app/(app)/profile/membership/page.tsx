import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          <Link href="/events">
            <Button className="mt-4">Browse Pulse Hub</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.pathway === "zahari") {
    redirect("/concierge/zahari/pay");
  }

  redirect("/apply");
}
