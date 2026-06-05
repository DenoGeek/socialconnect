import Link from "next/link";
import { AGANO } from "@/lib/copy/agano";
import { MarketingHero, StepGrid } from "@/components/brand/marketing-section";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";

export default function EcosystemPage() {
  return (
    <>
      <MarketingHero
        headline="The Digital Sync of a Real-World Christian Community."
        sub="A closed-loop interface — not an open market for public scrolling."
      />
      <section className="mx-auto max-w-6xl px-4 py-16 space-y-12">
        <StepGrid steps={[...AGANO.steps]} />
        <Card>
          <CardTitle>Apps vs Agano</CardTitle>
          <CardSubtitle className="mt-2">
            Inspired by proven matchmaking models — without the noise.
          </CardSubtitle>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-left text-xs uppercase text-plum-900/50">
                <th className="py-2"></th>
                <th>Dating apps</th>
                <th>Agano Evermore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum-900/8">
              <tr>
                <td className="py-2">Privacy</td>
                <td>Public profiles</td>
                <td>Community Alias until mutual match</td>
              </tr>
              <tr>
                <td className="py-2">First connection</td>
                <td>Endless swiping</td>
                <td>Curated real-world socials</td>
              </tr>
              <tr>
                <td className="py-2">Intent</td>
                <td>Mixed casual crowd</td>
                <td>Marriage-minded believers 27–60</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Link href="/register">
          <Button>Create profile</Button>
        </Link>
      </section>
    </>
  );
}
