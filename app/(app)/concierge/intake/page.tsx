import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitIntake } from "./actions";
import { requireUser } from "@/lib/auth";

export default async function IntakePage() {
  const user = await requireUser();
  return (
    <div className="max-w-md space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Reserve a consultation
        </h1>
        <p className="text-sm text-plum-900/60">
          High-priority. Your details are stored separately from your matching
          profile.
        </p>
      </header>
      <Card>
        <CardTitle>Tell us a little</CardTitle>
        <CardSubtitle>Name, phone, email. That&rsquo;s it.</CardSubtitle>
        <form action={submitIntake} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required defaultValue={user.name} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user.email}
            />
          </div>
          <div>
            <Label htmlFor="requirements">Anything else? (optional)</Label>
            <Textarea id="requirements" name="requirements" rows={3} />
          </div>
          <Button type="submit" className="w-full">
            Reserve
          </Button>
        </form>
      </Card>
    </div>
  );
}
