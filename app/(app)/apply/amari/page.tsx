import { submitAmariApplication } from "../actions";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ApplyAmariPage() {
  await requireUser();
  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Amari Fellowship application
        </h1>
        <p className="text-sm text-plum-900/60">
          Complimentary entry for intentional Christian singles aged 27–60.
        </p>
      </header>
      <Card>
        <CardTitle>Your details</CardTitle>
        <CardSubtitle>Reviewed by our concierge team before access.</CardSubtitle>
        <form action={submitAmariApplication} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="ageAttested">Your age</Label>
            <Input
              id="ageAttested"
              name="ageAttested"
              type="number"
              min={27}
              max={60}
              required
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required placeholder="Nairobi" />
          </div>
          <div>
            <Label htmlFor="intentSummary">Why are you here?</Label>
            <Textarea
              id="intentSummary"
              name="intentSummary"
              rows={4}
              required
              placeholder="Marriage-minded, faith-grounded…"
            />
          </div>
          <Label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="optIntoCandidatePool" />
            Optionally join the confidential candidate pool for Zahari clients
            (no public visibility)
          </Label>
          <Button type="submit" className="w-full">
            Submit application
          </Button>
        </form>
      </Card>
    </div>
  );
}
