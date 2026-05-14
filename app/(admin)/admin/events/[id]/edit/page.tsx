import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addTicket, updateEvent } from "../../actions";

function toLocalInput(d: Date) {
  const z = new Date(d);
  z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
  return z.toISOString().slice(0, 16);
}

export default async function EditEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [e] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  if (!e) notFound();

  const tickets = await db
    .select()
    .from(schema.eventTickets)
    .where(eq(schema.eventTickets.eventId, e.id))
    .orderBy(asc(schema.eventTickets.tier));

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{e.title}</h1>
        <Badge tone={e.status === "published" ? "mint" : "neutral"}>
          {e.status}
        </Badge>
      </header>

      <Card>
        <form action={updateEvent} className="space-y-3">
          <input type="hidden" name="id" value={e.id} />
          <div>
            <Label>Title</Label>
            <Input name="title" defaultValue={e.title} required />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input name="subtitle" defaultValue={e.subtitle ?? ""} />
          </div>
          <div>
            <Label>City</Label>
            <Input name="city" defaultValue={e.city ?? ""} />
          </div>
          <div>
            <Label>Venue</Label>
            <Input name="venue" defaultValue={e.venue ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts at</Label>
              <Input
                type="datetime-local"
                name="startsAt"
                defaultValue={toLocalInput(e.startsAt)}
              />
            </div>
            <div>
              <Label>Ends at</Label>
              <Input
                type="datetime-local"
                name="endsAt"
                defaultValue={toLocalInput(e.endsAt)}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={5}
              defaultValue={e.description ?? ""}
            />
          </div>
          <div>
            <Label>Hero image URL</Label>
            <Input name="heroImageUrl" defaultValue={e.heroImageUrl ?? ""} />
          </div>
          <div>
            <Label>Itinerary (JSON)</Label>
            <Textarea
              name="itinerary"
              rows={6}
              defaultValue={JSON.stringify(e.itinerary ?? [], null, 2)}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                name="capacity"
                defaultValue={e.capacity}
              />
            </div>
            <div>
              <Label>
                <input
                  type="checkbox"
                  name="eliteOnly"
                  defaultChecked={e.eliteOnly}
                />{" "}
                Elite-only
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save draft</Button>
            <Button type="submit" variant="outline" name="publish" value="1">
              Save & publish
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Tickets</CardTitle>
        <CardSubtitle>
          Tier prices in KSh and USD. Capacity defines availability.
        </CardSubtitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {tickets.map((t) => (
            <li key={t.id} className="flex justify-between py-2">
              <span>
                {t.label} ·{" "}
                <span className="opacity-60">
                  KSh {Number(t.priceKsh).toLocaleString()} / $
                  {Number(t.priceUsd).toLocaleString()}
                </span>
              </span>
              <span>
                {t.sold}/{t.capacity}
              </span>
            </li>
          ))}
        </ul>
        <form action={addTicket} className="mt-4 space-y-2 grid grid-cols-2 gap-2">
          <input type="hidden" name="eventId" value={e.id} />
          <select
            name="tier"
            className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="one_day">One day</option>
            <option value="two_day">Two day</option>
            <option value="member_exclusive">Member exclusive</option>
            <option value="elite_only">Elite only</option>
          </select>
          <Input name="label" placeholder="Label" required />
          <Input name="priceKsh" placeholder="Price KSh" required />
          <Input name="priceUsd" placeholder="Price USD" required />
          <Input
            name="capacity"
            type="number"
            placeholder="Capacity"
            required
          />
          <Input
            name="memberDiscountPct"
            type="number"
            placeholder="Member discount %"
            defaultValue={0}
          />
          <Button type="submit" className="col-span-2">
            Add ticket
          </Button>
        </form>
      </Card>
    </div>
  );
}
