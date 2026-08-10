import { AppLink } from "@/components/nav/app-link";
import { redirect } from "next/navigation";
import { requireUser, getLatestApplication, canAccessEcosystem } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isZahariSubscriptionActive,
  zahariJourneyLabel,
} from "@/lib/membership/zahari-status";

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

    if (isZahariSubscriptionActive(eng)) {
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

    if (eng?.status === "pending_payment") {
      return (
        <Card className="max-w-md">
          <Badge tone="amber">Interview passed</Badge>
          <CardTitle className="mt-2">Choose your Zahari plan</CardTitle>
          <CardSubtitle>
            USD {Number(eng.sovereignSearchFeeUsd).toLocaleString()} for{" "}
            {eng.plan === "1_year" ? "1 year" : "6 months"} — private matching,
            date packages, and elite couples access.
          </CardSubtitle>
          <AppLink href="/concierge/zahari/pay" className="block mt-4">
            <Button>Proceed to payment</Button>
          </AppLink>
        </Card>
      );
    }

    if (eng?.status === "interview_scheduled") {
      return (
        <Card className="max-w-md">
          <Badge tone="amber">Interview scheduled</Badge>
          <CardTitle className="mt-2">Your matchmaker interview</CardTitle>
          <CardSubtitle>
            {eng.interviewScheduledAt
              ? new Date(eng.interviewScheduledAt).toLocaleString("en-GB")
              : "Date pending"}
            {eng.interviewMeetingUrl ? ` · ${eng.interviewMeetingUrl}` : ""}
          </CardSubtitle>
          <AppLink href="/concierge/zahari/pay" className="block mt-4">
            <Button variant="outline">View journey details</Button>
          </AppLink>
        </Card>
      );
    }

    if (eng?.status === "interview_rejected") {
      return (
        <Card className="max-w-md">
          <Badge tone="amber">Not a Zahari fit</Badge>
          <CardTitle className="mt-2">You can switch to Amari</CardTitle>
          <CardSubtitle>
            No payment was taken. Move to the complimentary Amari pathway anytime from Account.
          </CardSubtitle>
          <AppLink href="/account" className="block mt-4">
            <Button>Open Account</Button>
          </AppLink>
        </Card>
      );
    }

    return (
      <Card className="max-w-md">
        <Badge tone="amber">{zahariJourneyLabel(eng)}</Badge>
        <CardTitle className="mt-2">Awaiting interview booking</CardTitle>
        <CardSubtitle>
          Staff will book a private 20-minute video chat. Payment opens only after you are confirmed as a match.
        </CardSubtitle>
        <AppLink href="/account" className="block mt-4">
          <Button variant="outline">Account & membership</Button>
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
