import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGANO } from "@/lib/copy/agano";
import { StepGrid } from "@/components/brand/marketing-section";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";

export default async function MarketingHome() {
  let totalActive = 0;
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(schema.users)
      .where(eq(schema.users.banned, false));
    totalActive = Number(value);
  } catch {
    totalActive = 0;
  }

  return (
    <>
      <section className="brand-bg">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <p className="text-xs uppercase tracking-[0.4em] text-plum-100/70 mb-4">
            {AGANO.brand}
          </p>
          <h1 className="text-display text-4xl md:text-6xl leading-[1.05] text-plum-100 max-w-4xl">
            {AGANO.heroHeadline}
          </h1>
          <p className="mt-6 max-w-xl text-plum-100/70 text-lg">
            {AGANO.heroSub}
          </p>
          <p className="mt-4 max-w-2xl text-plum-100/60 text-sm">
            A private, closed-loop ecosystem for intentional Christian singles
            aged 27–60 — eliminating superficial noise to build sacred, guarded
            space where God-led legacies begin.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/journey">
              <Button variant="elite" size="lg">
                Choose your journey
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-plum-100/30 text-plum-100 hover:bg-white/20"
              >
                Create profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 border-t border-plum-900/8">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-display text-2xl text-plum-900 mb-4">
              What you&rsquo;ll leave behind
            </h2>
            <ul className="text-sm text-plum-900/70 space-y-2 list-disc pl-4">
              <li>Endless swiping and inbox graveyards</li>
              <li>Sharing contact details before alignment</li>
              <li>Dating pools without marriage intent</li>
              <li>Visual surprises and value compromises</li>
            </ul>
          </div>
          <div>
            <h2 className="text-display text-2xl text-plum-900 mb-4">
              What you are walking into
            </h2>
            <ul className="text-sm text-plum-900/70 space-y-2 list-disc pl-4">
              <li>Absolute privacy by design — Community Alias</li>
              <li>Chemistry-first at curated socials & retreats</li>
              <li>Strictly marriage-minded, vetted believers</li>
              <li>Complimentary mutual match coordination (Amari)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-plum-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-display text-3xl text-plum-900 mb-8">
            How we work
          </h2>
          <StepGrid steps={[...AGANO.steps]} />
          <Link href="/ecosystem" className="inline-block mt-8 text-sm underline text-plum-900">
            Learn more about our ecosystem →
          </Link>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-plum-900/60 mb-2">
              The Social Ledger
            </p>
            <h3 className="text-display text-2xl text-plum-900">
              <span data-testid="social-ledger-count">
                {totalActive.toLocaleString()}
              </span>{" "}
              Souls connecting today.
            </h3>
            <p className="text-sm text-plum-900/60 mt-1">
              We count the community without revealing a single name.
            </p>
          </div>
          <Badge tone="mint" className="text-sm px-4 py-2">
            Privacy by default
          </Badge>
        </div>
      </section>

      <section className="bg-plum-50 py-16">
        <div className="mx-auto max-w-6xl px-4 grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle>Amari · The Fellowship</CardTitle>
            <CardSubtitle className="mt-2">
              Complimentary community pathway — events, Match Cards, Date Vault.
            </CardSubtitle>
            <Link href="/register">
              <Button className="mt-4">Create Amari profile</Button>
            </Link>
          </Card>
          <Card>
            <CardTitle>Zahari · The Private Circle</CardTitle>
            <CardSubtitle className="mt-2">
              White-glove concierge — invisible on the platform, human-led curation.
            </CardSubtitle>
            <Link href="/register">
              <Button variant="outline" className="mt-4">
                Apply for Zahari
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
