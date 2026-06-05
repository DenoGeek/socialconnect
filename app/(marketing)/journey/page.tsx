import Link from "next/link";
import { MarketingHero } from "@/components/brand/marketing-section";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JourneyPage() {
  return (
    <>
      <MarketingHero
        headline="Two Pathways. One Sacred Destination."
        sub="Amari for community fellowship; Zahari for white-glove concierge matching."
      />
      <section className="mx-auto max-w-6xl px-4 py-16 grid gap-8 md:grid-cols-2">
        <Card>
          <CardTitle>Amari Fellowship Plan</CardTitle>
          <CardSubtitle className="mt-2">
            Vetted community & organic connections — complimentary entry.
          </CardSubtitle>
          <ul className="mt-4 text-sm text-plum-900/70 space-y-2 list-disc pl-4">
            <li>Secure Community Alias</li>
            <li>Evermore Socials & Pulse invitations</li>
            <li>Free mutual match coordination</li>
            <li>Courtship Launchpad on match</li>
          </ul>
          <p className="mt-4 text-display text-2xl text-plum-900">
            Complimentary
          </p>
          <Link href="/register">
            <Button className="mt-4 w-full">Create your Amari profile</Button>
          </Link>
        </Card>
        <Card className="border-amber/30">
          <CardTitle>Zahari Sovereign Plan</CardTitle>
          <CardSubtitle className="mt-2">
            Ultra-private concierge for high-profile professionals.
          </CardSubtitle>
          <ul className="mt-4 text-sm text-plum-900/70 space-y-2 list-disc pl-4">
            <li>Blind profile guarantee</li>
            <li>Dedicated matchmaker</li>
            <li>Premium date orchestration</li>
            <li>Evermore Society access</li>
          </ul>
          <p className="mt-4 text-sm text-plum-900">
            Sovereign Search: <strong>USD 1,500</strong> (6 months, after approval)
          </p>
          <p className="text-sm text-plum-900">
            Covenant Activation: <strong>USD 1,000</strong> (on mutual courtship)
          </p>
          <Link href="/register">
            <Button variant="outline" className="mt-4 w-full">
              Apply for Zahari Society
            </Button>
          </Link>
        </Card>
      </section>
    </>
  );
}
