import Link from "next/link";
import { AppLink } from "@/components/nav/app-link";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function MarketingHome() {
  // Social Ledger: total active souls in the ecosystem, no PII.
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
            The Relationship Nervous System
          </p>
          <h1 className="text-display text-5xl md:text-7xl leading-[1.05] text-plum-100 max-w-3xl">
            From Discovery to Covenant — one ecosystem.
          </h1>
          <p className="mt-6 max-w-xl text-plum-100/70 text-lg">
            Evermore is where Singles, Couples, and Elites meet, build, and grow
            — through curated retreats, intentional matching, and the Agano
            covenant journey.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button variant="elite" size="lg">
                Begin your journey
              </Button>
            </Link>
            <AppLink href="/events">
              <Button variant="outline" size="lg" className="bg-white/10 border-plum-100/30 text-plum-100 hover:bg-white/20">
                Explore the Pulse
              </Button>
            </AppLink>
          </div>
        </div>
      </section>

      <section className="bg-plum-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Tier
              tone="plum"
              name="Evermore Pulse"
              body="Singles, badged with intent. Retreats with seating curated by your psychometric DNA, not by chance."
              href="/events"
              cta="See upcoming events"
            />
            <Tier
              tone="mint"
              name="Agano Hearth"
              body="For partnered couples. Modern-Rustic stays, marital programs, and the Date Vault for ongoing creative chill."
              href="/residential"
              cta="Step into the Hearth"
            />
            <Tier
              tone="amber"
              name="Silent Match"
              body="For Elites who prefer discretion. A private portal with a direct line to your concierge."
              href="/concierge"
              cta="Reserve a consultation"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 border-t border-plum-900/8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-plum-900/60 mb-2">
              The Social Ledger
            </p>
            <h3 className="text-display text-2xl text-plum-900">
              <span data-testid="social-ledger-count">{totalActive.toLocaleString()}</span>{" "}
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
    </>
  );
}

function Tier({
  tone,
  name,
  body,
  href,
  cta,
}: {
  tone: "plum" | "mint" | "amber";
  name: string;
  body: string;
  href: string;
  cta: string;
}) {
  const toneClass =
    tone === "plum"
      ? "from-plum-900 to-plum-700 text-plum-100"
      : tone === "mint"
        ? "from-mint to-teal text-plum-900"
        : "from-amber to-[#e29c2c] text-plum-900";
  const inner = (
    <div
      className={`rounded-3xl p-8 bg-gradient-to-br ${toneClass} h-full transition hover:-translate-y-1`}
    >
      <h3 className="text-display text-2xl mb-3">{name}</h3>
      <p className="opacity-80 text-sm leading-relaxed mb-6">{body}</p>
      <span className="text-sm font-medium underline-offset-4 underline">
        {cta} →
      </span>
    </div>
  );
  return (
    <AppLink href={href} className="block">
      {inner}
    </AppLink>
  );
}
