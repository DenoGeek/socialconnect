import { AppLink } from "@/components/nav/app-link";
import { redirect } from "next/navigation";
import { requireUser, getLatestApplication, canAccessEcosystem } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ApplyStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const app = await getLatestApplication(user.id);

  if (canAccessEcosystem(user) && user.pathway === "amari") {
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);
    if (!profile?.onboardingCompletedAt) {
      return (
        <Card className="max-w-md">
          <Badge tone="mint">Approved · Amari</Badge>
          <CardTitle className="mt-2">Welcome to the Fellowship</CardTitle>
          <CardSubtitle>Complete your profile next.</CardSubtitle>
          <AppLink href="/profile/onboarding" className="block mt-4">
            <Button>Continue your profile</Button>
          </AppLink>
        </Card>
      );
    }
    redirect("/profile");
  }

  if (canAccessEcosystem(user) && user.pathway === "zahari") {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, user.id))
      .limit(1);
    if (!eng?.sovereignPaidAt) {
      return (
        <Card className="max-w-md">
          <Badge tone="amber">Approved · Zahari</Badge>
          <CardTitle className="mt-2">Pay sovereign search fee</CardTitle>
          <CardSubtitle>
            USD {Number(eng?.sovereignSearchFeeUsd ?? 1500).toLocaleString()} —
            activates your 6-month private search.
          </CardSubtitle>
          <AppLink href="/concierge/zahari/pay" className="block mt-4">
            <Button>Proceed to payment</Button>
          </AppLink>
        </Card>
      );
    }
    return (
      <Card className="max-w-md">
        <Badge tone="amber">Zahari active</Badge>
        <CardTitle className="mt-2">Your concierge portal</CardTitle>
        <AppLink href="/concierge" className="block mt-4">
          <Button>Open concierge</Button>
        </AppLink>
      </Card>
    );
  }

  const rejected =
    sp.state === "rejected" || user.vettingStatus === "rejected" || app?.status === "rejected";

  return (
    <div className="max-w-md space-y-4">
      <Card>
        <CardTitle>Application status</CardTitle>
        {rejected ? (
          <>
            <Badge tone="amber" className="mt-2">
              Not approved
            </Badge>
            <CardSubtitle className="mt-3">
              {app?.rejectionReason ??
                "We could not offer a place in the circle at this time."}
            </CardSubtitle>
            <AppLink href="/apply" className="block mt-4 text-sm underline">
              Apply again →
            </AppLink>
          </>
        ) : app?.status === "submitted" || app?.status === "in_review" ? (
          <>
            <Badge tone="neutral" className="mt-2">
              Under review
            </Badge>
            <CardSubtitle className="mt-3">
              Pathway: {app.pathway}. We typically respond within a few business
              days.
            </CardSubtitle>
          </>
        ) : (
          <>
            <CardSubtitle className="mt-3">
              No application on file yet.
            </CardSubtitle>
            <AppLink href="/apply" className="block mt-4">
              <Button>Choose your pathway</Button>
            </AppLink>
          </>
        )}
      </Card>
    </div>
  );
}
