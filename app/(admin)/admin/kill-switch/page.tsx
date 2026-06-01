import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toggleSwitch } from "./actions";

export default async function KillSwitch() {
  await requireAdmin();
  const rows = await db.select().from(schema.regionalKillSwitches);

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Kill switch</h1>
        <p className="text-sm text-plum-900/60">
          Disable app access by region during emergencies or planned downtime.
        </p>
      </header>

      <Card>
        <CardTitle>Add or update a region</CardTitle>
        <form action={toggleSwitch} className="mt-3 space-y-2">
          <div>
            <Label htmlFor="region">Region (country code)</Label>
            <Input id="region" name="region" placeholder="KE / NG / US" required />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" placeholder="Maintenance, incident…" />
          </div>
          <Button type="submit" variant="danger">
            Toggle
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Active switches</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {rows.map((s) => (
            <li key={s.id} className="flex justify-between py-2">
              <span>
                <strong>{s.region}</strong>{" "}
                <span className="text-xs text-plum-900/50">{s.reason}</span>
              </span>
              <Badge tone={s.active ? "amber" : "neutral"}>
                {s.active ? "off" : "on"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
