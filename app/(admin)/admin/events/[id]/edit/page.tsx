import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketTiers } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { deleteTier, updateEvent, upsertTier } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function toLocalInput(d: Date) {
  // datetime-local needs YYYY-MM-DDTHH:mm in the user's local zone.
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();
  const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, id));

  const updateBound = updateEvent.bind(null, id);

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
          <CardTitle>Edit · {event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBound} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input name="title" required defaultValue={event.title} />
              </Field>
              <Field label="City">
                <Input name="city" required defaultValue={event.city} />
              </Field>
              <Field label="Venue">
                <Input name="venueName" defaultValue={event.venueName ?? ""} />
              </Field>
              <Field label="Cover image URL">
                <Input name="coverImageUrl" type="url" defaultValue={event.coverImageUrl ?? ""} />
              </Field>
              <Field label="Starts at">
                <Input name="startsAt" type="datetime-local" required defaultValue={toLocalInput(event.startsAt)} />
              </Field>
              <Field label="Ends at">
                <Input name="endsAt" type="datetime-local" required defaultValue={toLocalInput(event.endsAt)} />
              </Field>
              <Field label="Tier kind">
                <select
                  name="tier"
                  defaultValue={event.tier}
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
                  defaultValue={event.status}
                  className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="sold_out">Sold out</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Capacity">
                <Input name="capacity" type="number" min={1} required defaultValue={event.capacity} />
              </Field>
            </div>

            <Field label="Description">
              <Textarea name="description" rows={5} defaultValue={event.description ?? ""} />
            </Field>

            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ticket tiers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {tiers.length === 0 && <p className="text-sm text-stone-500">No tiers yet.</p>}
          {tiers.map((tier) => (
            <TierRow key={tier.id} eventId={id} tier={tier} />
          ))}

          <form action={upsertTier.bind(null, id)} className="grid gap-3 rounded-2xl border border-dashed border-stone-300 p-4 sm:grid-cols-4 sm:items-end">
            <Field label="New tier">
              <Input name="name" placeholder="Couple" required />
            </Field>
            <Field label="Price (KES)">
              <Input name="priceKes" type="number" min={0} required />
            </Field>
            <Field label="Max qty">
              <Input name="maxQty" type="number" min={1} required />
            </Field>
            <Button type="submit" size="sm">Add tier</Button>
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

function TierRow({
  eventId,
  tier,
}: {
  eventId: string;
  tier: { id: string; name: string; priceKes: number; maxQty: number; soldQty: number; description: string | null };
}) {
  const upsertBound = upsertTier.bind(null, eventId);
  const deleteBound = deleteTier.bind(null, eventId, tier.id);

  return (
    <div className="rounded-2xl border border-stone-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{tier.name}</p>
        <Badge variant="muted">
          {tier.soldQty} / {tier.maxQty} sold
        </Badge>
      </div>
      <form action={upsertBound} className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="id" value={tier.id} />
        <Field label="Name">
          <Input name="name" required defaultValue={tier.name} />
        </Field>
        <Field label="Price (KES)">
          <Input name="priceKes" type="number" min={0} required defaultValue={tier.priceKes} />
        </Field>
        <Field label="Max qty">
          <Input name="maxQty" type="number" min={1} required defaultValue={tier.maxQty} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="outline">Save</Button>
          <Button formAction={deleteBound} type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </div>
      </form>
    </div>
  );
}
