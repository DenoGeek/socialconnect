import { AppLink } from "@/components/nav/app-link";
import { redirect } from "next/navigation";
import { requireUser, canAccessEcosystem } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ApplyPage() {
  const user = await requireUser();
  if (canAccessEcosystem(user) && user.pathway) {
    redirect(user.pathway === "zahari" ? "/concierge" : "/profile/onboarding");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Choose your pathway
        </h1>
        <p className="text-sm text-plum-900/60 mt-2">
          Two pathways. One sacred destination. Applications are reviewed before
          you enter the ecosystem.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Amari · The Fellowship</CardTitle>
          <CardSubtitle className="mt-2">
            Promised by God. Vibrant community, Evermore Socials, Pulse retreats,
            and Match Cards — complimentary entry.
          </CardSubtitle>
          <ul className="mt-3 text-sm text-plum-900/70 space-y-1 list-disc pl-4">
            <li>Secure Community Alias</li>
            <li>Real-world chemistry first</li>
            <li>Free mutual match coordination</li>
          </ul>
          <AppLink href="/apply/amari" className="block mt-4">
            <Button className="w-full">Create Amari profile</Button>
          </AppLink>
        </Card>

        <Card className="border-amber/40">
          <CardTitle>Zahari · The Private Circle</CardTitle>
          <CardSubtitle className="mt-2">
            God Has Remembered. White-glove concierge matching for high-profile
            professionals requiring absolute discretion.
          </CardSubtitle>
          <ul className="mt-3 text-sm text-plum-900/70 space-y-1 list-disc pl-4">
            <li>Dedicated matchmaker</li>
            <li>Digital invisibility</li>
            <li>USD 1,500 sovereign search (after approval)</li>
          </ul>
          <AppLink href="/apply/zahari" className="block mt-4">
            <Button variant="outline" className="w-full">
              Apply for Zahari
            </Button>
          </AppLink>
        </Card>
      </div>

      <AppLink href="/apply/status" className="text-sm underline text-plum-900">
        Check application status →
      </AppLink>
    </div>
  );
}
