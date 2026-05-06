import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = { title: "Your profile · Evermore" };

export default async function ProfilePage() {
  const session = await requireSession();

  // Lazy create the domain profile on first visit. Better Auth wrote the
  // users row at sign-up; the profile is a 1:1 we control.
  let [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id)).limit(1);
  if (!profile) {
    [profile] = await db
      .insert(profiles)
      .values({
        userId: session.user.id,
        displayName: session.user.name,
        country: "KE",
      })
      .returning();
  }
  if (!profile) redirect("/");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Profile</span>
        <h1 className="text-3xl font-semibold tracking-tight">{profile.displayName ?? session.user.name}</h1>
        <p className="text-sm text-stone-600">
          Tier <Badge variant="muted">{profile.tier}</Badge>
          {profile.city ? ` · ${profile.city}` : ""}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>The deep-dive that fuels concierge matching.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.onboardingCompletedAt ? (
              <p className="text-sm text-emerald-700">
                Completed {profile.onboardingCompletedAt.toLocaleDateString()}.
              </p>
            ) : (
              <p className="text-sm text-stone-600">
                Not started yet. The form takes about ten minutes.
              </p>
            )}
            <Link
              href="/profile/onboarding"
              className="mt-3 inline-flex text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              {profile.onboardingCompletedAt ? "Update answers" : "Begin"} →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets &amp; events</CardTitle>
            <CardDescription>Upcoming and past attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/events/me"
              className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              View my tickets →
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
