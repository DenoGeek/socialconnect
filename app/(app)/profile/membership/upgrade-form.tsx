import { Button } from "@/components/ui/button";
import { startMembershipUpgrade } from "./actions";

export function UpgradeForm({
  planSlug,
  planLabel,
  priceKsh,
}: {
  planSlug: string;
  planLabel: string;
  priceKsh: number;
}) {
  return (
    <form action={startMembershipUpgrade} className="mt-4 border-t border-plum-900/10 pt-4">
      <input type="hidden" name="plan" value={planSlug} />
      <Button type="submit" className="w-full">
        Simulate payment · KES {priceKsh.toLocaleString()} ({planLabel})
      </Button>
    </form>
  );
}
