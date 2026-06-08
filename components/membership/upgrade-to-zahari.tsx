import { AppLink } from "@/components/nav/app-link";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpgradeToZahariBanner({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  if (variant === "compact") {
    return (
      <AppLink
        href="/apply/zahari"
        className="text-sm underline text-amber hover:text-plum-100"
      >
        Upgrade to Zahari →
      </AppLink>
    );
  }

  return (
    <Card className="border-amber bg-amber-soft">
      <CardTitle>Zahari · The Private Circle</CardTitle>
      <CardSubtitle className="mt-2">
        White-glove concierge matching with absolute digital invisibility.
        Legacy Elite membership is being retired in favour of the Zahari pathway.
      </CardSubtitle>
      <AppLink href="/apply/zahari">
        <Button variant="elite" className="mt-4">
          Upgrade to Zahari
        </Button>
      </AppLink>
    </Card>
  );
}
