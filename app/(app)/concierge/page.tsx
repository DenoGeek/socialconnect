import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conciergeIntakes } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/server";

export const metadata = {
  title: "Concierge · Evermore",
  description: "Private, hand-led matchmaking for those who prefer to stay quiet.",
};

interface Package {
  name: string;
  priceKes: number;
  cadence: string;
  promise: string;
  includes: readonly string[];
  featured?: boolean;
}

const PACKAGES: readonly Package[] = [
  {
    name: "Curated",
    priceKes: 35_000,
    cadence: "one-off",
    promise: "A single thoughtful introduction, drawn from our circle.",
    includes: [
      "60-minute intake conversation",
      "One personally curated introduction",
      "Reservation booked at a partner location",
      "Post-date reflection with your concierge",
    ],
  },
  {
    name: "Silent Match",
    priceKes: 120_000,
    cadence: "quarterly",
    promise: "Discreet, off-platform matchmaking for high-profile clients.",
    includes: [
      "Background-light vetting of every candidate",
      "Up to four introductions per quarter",
      "Date logistics handled end-to-end",
      "Direct line to your concierge — by phone, never by app",
    ],
    featured: true,
  },
  {
    name: "Concierge+",
    priceKes: 60_000,
    cadence: "monthly",
    promise: "An ongoing rhythm — events, introductions, dates, all attended to.",
    includes: [
      "Priority access to every retreat",
      "Two introductions per month",
      "Date Vault reservations on request",
      "Quarterly relationship review",
    ],
  },
];

export default async function ConciergeLandingPage() {
  const session = await getSession();
  const existingIntake = session
    ? (
        await db
          .select()
          .from(conciergeIntakes)
          .where(eq(conciergeIntakes.userId, session.user.id))
          .limit(1)
      )[0]
    : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex max-w-2xl flex-col gap-4">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Concierge</span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Some introductions are best made by hand.
        </h1>
        <p className="text-base leading-relaxed text-stone-600">
          For people whose time, profile, or simple preference makes the events too public. Your
          concierge meets you in person, learns what matters, and chooses with care. No swiping;
          no public profile; no algorithm guessing on your behalf.
        </p>
        {existingIntake ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <Badge variant={existingIntake.status === "approved" ? "success" : "muted"}>
              {existingIntake.status.replace(/_/g, " ")}
            </Badge>
            <p className="mt-2 text-sm text-stone-700">
              Your intake is on file. We&apos;ll be in touch on the email you registered with.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={session ? "/concierge/intake" : "/login?redirect=/concierge/intake"}>
                Begin a private intake
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/events">Or start with the events</Link>
            </Button>
          </div>
        )}
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-medium tracking-tight">Packages</h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <li key={pkg.name}>
              <Card
                className={pkg.featured ? "border-stone-900 shadow-md" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{pkg.name}</CardTitle>
                    {pkg.featured && <Badge>Most private</Badge>}
                  </div>
                  <CardDescription>{pkg.promise}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <p className="text-2xl font-semibold tracking-tight">
                    KES {pkg.priceKes.toLocaleString("en-KE")}
                    <span className="ml-1 text-xs font-normal uppercase tracking-wide text-stone-500">
                      / {pkg.cadence}
                    </span>
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-stone-700">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-10">
        <h2 className="max-w-xl text-2xl font-medium tracking-tight">
          Already an Evermore member?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
          Your event impressions and post-date notes inform the Concierge the same way an intake
          does. The packages above are for those who prefer to skip the events entirely or who
          want their search treated as a quieter project.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/concierge/intake">Tell the Concierge what you&apos;re looking for</Link>
        </Button>
      </section>
    </main>
  );
}
