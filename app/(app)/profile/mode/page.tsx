import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { switchMode } from "../onboarding/actions";

export default async function ModeSwitchPage() {
  const user = await requireUser();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-display text-3xl text-plum-900">Switch mode</h1>
      <p className="text-sm text-plum-900/60">
        Switching modes keeps your private matching history intact. Use this for
        a specific mixer or to step into the Hearth.
      </p>

      <div className="grid gap-3">
        {(["explorer", "couple", "elite"] as const).map((m) => (
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

function label(m: "explorer" | "couple" | "elite") {
  return m === "explorer"
    ? "Explorer"
    : m === "couple"
      ? "Couple (Agano)"
      : "Elite (Silent)";
}

function description(m: "explorer" | "couple" | "elite") {
  return m === "explorer"
    ? "Public profile in the Pulse hub. Matching active."
    : m === "couple"
      ? "Duo-Sync, Hearth, marital programs. Past match history archived."
      : "Invisible profile. Silent Match Portal + concierge direct-line.";
}
