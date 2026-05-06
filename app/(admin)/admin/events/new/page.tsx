import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "../actions";

export const metadata = { title: "New event · Admin" };

export default function NewEventPage() {
  return (
    <section className="flex flex-col gap-6 p-8">
      <Link
        href="/admin/events"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New event</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input name="title" required />
              </Field>
              <Field label="City">
                <Input name="city" required defaultValue="Nairobi" />
              </Field>
              <Field label="Venue">
                <Input name="venueName" />
              </Field>
              <Field label="Cover image URL">
                <Input name="coverImageUrl" type="url" />
              </Field>
              <Field label="Starts at">
                <Input name="startsAt" type="datetime-local" required />
              </Field>
              <Field label="Ends at">
                <Input name="endsAt" type="datetime-local" required />
              </Field>
              <Field label="Tier kind">
                <select
                  name="tier"
                  defaultValue="one_day"
                  className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="one_day">One day</option>
                  <option value="two_day">Two day</option>
                  <option value="retreat">Retreat</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  name="status"
                  defaultValue="draft"
                  className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Capacity">
                <Input name="capacity" type="number" min={1} required defaultValue={50} />
              </Field>
            </div>

            <Field label="Description">
              <Textarea name="description" rows={4} />
            </Field>

            <fieldset className="rounded-2xl border border-stone-200 p-5">
              <legend className="px-2 text-xs uppercase tracking-wide text-stone-500">
                First ticket tier
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tier name">
                  <Input name="tierName" required defaultValue="Standard" />
                </Field>
                <Field label="Price (KES)">
                  <Input name="tierPrice" type="number" min={0} required defaultValue={2500} />
                </Field>
                <Field label="Max quantity">
                  <Input name="tierMaxQty" type="number" min={1} required defaultValue={50} />
                </Field>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                You can add more tiers (Member, Couple, …) after creating the event.
              </p>
            </fieldset>

            <div className="flex items-center gap-3">
              <Button type="submit" size="lg">Create event</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/admin/events">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
