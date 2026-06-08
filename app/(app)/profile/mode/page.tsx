import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { switchMode } from "../onboarding/actions";
import { UpgradeToZahariBanner } from "@/components/membership/upgrade-to-zahari";

export default async function ModeSwitchPage() {
  const user = await requireUser();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-display text-3xl text-plum-900">Switch mode</h1>
      <p className="text-sm text-plum-900/60">
        Switching modes keeps your private matching history intact. Use this for
        a specific mixer or to step into the Hearth.
      </p>

      {user.tier === "elite" && user.pathway === "amari" && (
        <UpgradeToZahariBanner />
      )}

      <div className="grid gap-3">
        {(["explorer", "couple"] as const).map((m) => (
          <Card key={m} className={user.mode === m ? "ring-2 ring-plum-900" : ""}>
            <CardTitle>{label(m)}</CardTitle>
            <CardSubtitle>{description(m)}</CardSubtitle>
            <form action={switchMode} className="mt-3">
              <input type="hidden" name="mode" value={m} />
              <Button
                type="submit"
                disabled={user.mode === m}
                variant={user.mode === m ? "outline" : "primary"}
              >
                {user.mode === m ? "Current mode" : `Switch to ${label(m)}`}
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}

function label(m: "explorer" | "couple") {
  return m === "explorer" ? "Community" : "Couple (Agano)";
}

function description(m: "explorer" | "couple") {
  return m === "explorer"
    ? "Active in the Pulse hub. Matching enabled."
    : "Duo-Sync, Hearth, and marital programs.";
}
