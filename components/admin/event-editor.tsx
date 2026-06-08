"use client";

import { useState } from "react";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { previewUsdFromKsh } from "@/lib/currency/usd-from-ksh";

type ItineraryItem = { time: string; label: string; detail?: string };

type TicketRow = {
  id: string;
  label: string;
  tier: string;
  priceKsh: string;
  priceUsd: string;
  sold: number;
  capacity: number;
};

const TABS = ["details", "itinerary", "tickets", "publish"] as const;
type Tab = (typeof TABS)[number];

function toLocalInput(d: Date | string) {
  const z = new Date(d);
  z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
  return z.toISOString().slice(0, 16);
}

export function EventEditor({
  event,
  tickets,
  kesPerUsd,
  rateSource,
  rateFetchedAt,
  updateAction,
  addTicketAction,
  createAction,
}: {
  event?: {
    id: string;
    title: string;
    subtitle: string | null;
    city: string | null;
    venue: string | null;
    description: string | null;
    heroImageUrl: string | null;
    capacity: number;
    eliteOnly: boolean;
    startsAt: Date;
    endsAt: Date;
    status: string;
    itinerary: ItineraryItem[];
  };
  tickets: TicketRow[];
  kesPerUsd: number;
  rateSource: string;
  rateFetchedAt: string;
  updateAction: (form: FormData) => void | Promise<void>;
  addTicketAction: (form: FormData) => void | Promise<void>;
  createAction?: (form: FormData) => void | Promise<void>;
}) {
  const isNew = !event;
  const [tab, setTab] = useState<Tab>("details");
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    event?.itinerary ?? [],
  );
  const [priceKsh, setPriceKsh] = useState("");

  const usdPreview = priceKsh
    ? previewUsdFromKsh(Number(priceKsh), kesPerUsd)
    : null;

  function addItineraryRow() {
    setItinerary((rows) => [...rows, { time: "", label: "" }]);
  }

  function updateItineraryRow(
    index: number,
    field: keyof ItineraryItem,
    value: string,
  ) {
    setItinerary((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function removeItineraryRow(index: number) {
    setItinerary((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-2xl space-y-6">
      {event && (
        <header>
          <h1 className="text-display text-3xl text-plum-900">{event.title}</h1>
          <Badge tone={event.status === "published" ? "mint" : "neutral"}>
            {event.status}
          </Badge>
        </header>
      )}

      {!isNew && (
        <div className="flex gap-1 border-b border-plum-900/10">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize ${
                tab === t
                  ? "border-b-2 border-plum-900 text-plum-900 font-medium"
                  : "text-plum-900/50 hover:text-plum-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {(tab === "details" || isNew) && (
        <Card>
          <CardTitle>{isNew ? "New event" : "Event details"}</CardTitle>
          <form
            action={isNew ? createAction : updateAction}
            className="mt-4 space-y-3"
          >
            {event && <input type="hidden" name="id" value={event.id} />}
            {!isNew && tab !== "publish" && (
              <input
                type="hidden"
                name="itinerary"
                value={JSON.stringify(itinerary)}
              />
            )}
            <div>
              <Label>Title</Label>
              <Input
                name="title"
                defaultValue={event?.title}
                required
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input name="subtitle" defaultValue={event?.subtitle ?? ""} />
            </div>
            <div>
              <Label>City</Label>
              <Input name="city" defaultValue={event?.city ?? ""} />
            </div>
            <div>
              <Label>Venue</Label>
              <Input name="venue" defaultValue={event?.venue ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  name="startsAt"
                  defaultValue={
                    event ? toLocalInput(event.startsAt) : undefined
                  }
                  required
                />
              </div>
              <div>
                <Label>Ends at</Label>
                <Input
                  type="datetime-local"
                  name="endsAt"
                  defaultValue={event ? toLocalInput(event.endsAt) : undefined}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                rows={5}
                defaultValue={event?.description ?? ""}
              />
            </div>
            <div>
              <Label>Hero image URL</Label>
              <Input
                name="heroImageUrl"
                defaultValue={event?.heroImageUrl ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  name="capacity"
                  defaultValue={event?.capacity ?? 100}
                />
              </div>
              <div className="flex items-end pb-2">
                <Label>
                  <input
                    type="checkbox"
                    name="eliteOnly"
                    defaultChecked={event?.eliteOnly}
                  />{" "}
                  Elite-only
                </Label>
              </div>
            </div>
            <Button type="submit">
              {isNew ? "Create event" : "Save details"}
            </Button>
          </form>
        </Card>
      )}

      {tab === "itinerary" && event && (
        <Card>
          <CardTitle>Itinerary</CardTitle>
          <CardSubtitle>
            Schedule items shown to ticket holders on the event page.
          </CardSubtitle>
          <form action={updateAction} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={event.id} />
            <input
              type="hidden"
              name="title"
              value={event.title}
            />
            <input type="hidden" name="subtitle" value={event.subtitle ?? ""} />
            <input type="hidden" name="city" value={event.city ?? ""} />
            <input type="hidden" name="venue" value={event.venue ?? ""} />
            <input
              type="hidden"
              name="startsAt"
              value={toLocalInput(event.startsAt)}
            />
            <input
              type="hidden"
              name="endsAt"
              value={toLocalInput(event.endsAt)}
            />
            <input
              type="hidden"
              name="description"
              value={event.description ?? ""}
            />
            <input
              type="hidden"
              name="heroImageUrl"
              value={event.heroImageUrl ?? ""}
            />
            <input type="hidden" name="capacity" value={event.capacity} />
            {event.eliteOnly && (
              <input type="hidden" name="eliteOnly" value="on" />
            )}
            <input
              type="hidden"
              name="itinerary"
              value={JSON.stringify(itinerary)}
            />
            <div className="space-y-3">
              {itinerary.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-plum-900/10 p-3"
                >
                  <Input
                    placeholder="Time (e.g. Fri 17:00)"
                    value={item.time}
                    onChange={(e) =>
                      updateItineraryRow(i, "time", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) =>
                      updateItineraryRow(i, "label", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Detail (optional)"
                    value={item.detail ?? ""}
                    onChange={(e) =>
                      updateItineraryRow(i, "detail", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItineraryRow(i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addItineraryRow}>
              Add item
            </Button>
            <Button type="submit">Save itinerary</Button>
          </form>
        </Card>
      )}

      {tab === "tickets" && event && (
        <Card>
          <CardTitle>Tickets</CardTitle>
          <CardSubtitle>
            Enter price in KSh — USD is calculated at 1 USD = {kesPerUsd.toFixed(2)}{" "}
            KES ({rateSource}, updated{" "}
            {new Date(rateFetchedAt).toLocaleString("en-GB")}).
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
          <form
            action={addTicketAction}
            className="mt-4 space-y-2 grid grid-cols-2 gap-2"
          >
            <input type="hidden" name="eventId" value={event.id} />
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
            <Input
              name="priceKsh"
              placeholder="Price KSh"
              required
              value={priceKsh}
              onChange={(e) => setPriceKsh(e.target.value)}
            />
            <div className="flex items-center text-sm text-plum-900/60 px-2">
              USD preview:{" "}
              {usdPreview != null ? `$${usdPreview.toLocaleString()}` : "—"}
            </div>
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
      )}

      {tab === "publish" && event && (
        <Card>
          <CardTitle>Review & publish</CardTitle>
          <CardSubtitle>
            {event.title} · {event.city ?? "No city"} · {tickets.length}{" "}
            ticket tier{tickets.length === 1 ? "" : "s"} · {itinerary.length}{" "}
            itinerary item{itinerary.length === 1 ? "" : "s"}
          </CardSubtitle>
          <form action={updateAction} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="title" value={event.title} />
            <input type="hidden" name="subtitle" value={event.subtitle ?? ""} />
            <input type="hidden" name="city" value={event.city ?? ""} />
            <input type="hidden" name="venue" value={event.venue ?? ""} />
            <input
              type="hidden"
              name="startsAt"
              value={toLocalInput(event.startsAt)}
            />
            <input
              type="hidden"
              name="endsAt"
              value={toLocalInput(event.endsAt)}
            />
            <input
              type="hidden"
              name="description"
              value={event.description ?? ""}
            />
            <input
              type="hidden"
              name="heroImageUrl"
              value={event.heroImageUrl ?? ""}
            />
            <input type="hidden" name="capacity" value={event.capacity} />
            {event.eliteOnly && (
              <input type="hidden" name="eliteOnly" value="on" />
            )}
            <input
              type="hidden"
              name="itinerary"
              value={JSON.stringify(itinerary)}
            />
            <div className="flex gap-2">
              <Button type="submit">Save draft</Button>
              <Button type="submit" variant="outline" name="publish" value="1">
                Save & publish
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
