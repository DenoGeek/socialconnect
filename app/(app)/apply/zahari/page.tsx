import { submitZahariApplication } from "../actions";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ApplyZahariPage() {
  await requireUser();
  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Zahari Society application
        </h1>
        <p className="text-sm text-plum-900/60">
          Ultra-private matchmaking. After approval: USD 1,500 sovereign search
          fee, then USD 1,000 covenant activation when you enter courtship.
        </p>
      </header>
      <Card>
        <form action={submitZahariApplication} className="space-y-3">
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
            <Label htmlFor="city">Primary city</Label>
            <Input id="city" name="city" required />
          </div>
          <div>
            <Label htmlFor="professionalContext">Professional context</Label>
            <Textarea
              id="professionalContext"
              name="professionalContext"
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="discretionRequirements">Discretion needs</Label>
            <Textarea
              id="discretionRequirements"
              name="discretionRequirements"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="legacyGoals">Legacy & covenant goals</Label>
            <Textarea
              id="legacyGoals"
              name="legacyGoals"
              rows={3}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Submit for review
          </Button>
        </form>
      </Card>
    </div>
  );
}
