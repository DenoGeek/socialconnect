import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitLicensingApplication } from "./actions";

export default async function Licensing() {
  await requireFacilitator();

  const applications = await db
    .select()
    .from(schema.licensingApplications)
    .orderBy(desc(schema.licensingApplications.createdAt));

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          B2B Licensing Portal
        </h1>
        <p className="text-sm text-plum-900/60">
          Apply for Agano Certification, manage bookings, view net earnings,
          and respond to guest reviews.
        </p>
      </header>

      <Card>
        <CardTitle>New application</CardTitle>
        <CardSubtitle>
          Upload property photos and confirm Agano Standards compliance.
        </CardSubtitle>
        <form action={submitLicensingApplication} className="mt-4 space-y-3">
          <div>
            <Label>Property name</Label>
            <Input name="propertyName" required />
          </div>
          <div>
            <Label>Photo URLs (one per line)</Label>
            <textarea
              name="photos"
              rows={4}
              className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </div>
          <fieldset className="rounded-2xl bg-plum-900/5 p-3 space-y-2 text-sm">
            <legend className="px-2 text-xs uppercase tracking-widest text-plum-900/50">
              Agano Standards
            </legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="cleanlinessVerified" /> Cleanliness
              audit complete
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="safetyVerified" /> Safety inspection
              complete
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="connectionBoxReady" /> Connection
              Box space allocated
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="aestheticAligned" /> Aesthetic
              aligned with Modern-Rustic
            </label>
          </fieldset>
          <Button type="submit">Submit application</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Applications</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {applications.map((a) => (
            <li key={a.id} className="py-2 flex justify-between">
              <span>{a.propertyName}</span>
              <Badge
                tone={
                  a.status === "approved"
                    ? "mint"
                    : a.status === "rejected"
                      ? "neutral"
                      : "amber"
                }
              >
                {a.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
