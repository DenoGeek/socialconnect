import Link from "next/link";
import { MarketingHero } from "@/components/brand/marketing-section";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CirclesPage() {
  return (
    <>
      <MarketingHero
        headline="Circles & Cultivated Spaces"
        sub="From first hello to covenant — one protective loop."
      />
      <section className="mx-auto max-w-6xl px-4 py-16 grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Evermore Socials</CardTitle>
          <CardSubtitle>
            Mixers that feel like an evening with friends — artisan workshops,
            creative activities, organic fellowship.
          </CardSubtitle>
        </Card>
        <Card>
          <CardTitle>Evermore Pulse</CardTitle>
          <CardSubtitle>
            Multi-day immersive retreats in peaceful landscapes — deep bonds with a
            vetted circle of believers.
          </CardSubtitle>
        </Card>
        <Card>
          <CardTitle>Agano Evermore Sync App</CardTitle>
          <CardSubtitle>
            Private dashboard for events, Match Cards, Date Vault, and programs —
            your identity shielded by alias.
          </CardSubtitle>
        </Card>
        <Card>
          <CardTitle>Hearth & Marrow Connection Boxes</CardTitle>
          <CardSubtitle>
            Residential experiences that bypass small talk and reach the marrow of
            relationship.
          </CardSubtitle>
        </Card>
        <Link href="/journey" className="md:col-span-2">
          <Button>Choose your journey</Button>
        </Link>
      </section>
    </>
  );
}
