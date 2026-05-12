"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils/format";
import { bookProperty } from "./actions";

type Property = {
  id: string;
  slug: string;
  title: string;
  nightlyKsh: number;
  nightlyUsd: number;
  minNights: number;
  maxOccupancy: number;
};

type AddOn = { id: string; name: string; priceKsh: number; priceUsd: number };

export function BookingForm({
  property,
  addOns,
  bookedRanges,
}: {
  property: Property;
  addOns: AddOn[];
  bookedRanges: { from: string; to: string }[];
}) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [currency, setCurrency] = useState<"KSH" | "USD">("KSH");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const isWeekendStay =
    checkIn && [5, 6].includes(new Date(checkIn).getDay());
  const weekendUplift = isWeekendStay ? 1.15 : 1;

  const overlap = bookedRanges.some(
    (r) =>
      checkIn &&
      checkOut &&
      new Date(checkIn) < new Date(r.to) &&
      new Date(checkOut) > new Date(r.from),
  );

  const nightly =
    currency === "KSH" ? property.nightlyKsh : property.nightlyUsd;
  const subtotal = Math.round(nightly * nights * weekendUplift);
  const addOnTotal = addOns
    .filter((a) => selectedAddOns.includes(a.id))
    .reduce(
      (sum, a) => sum + (currency === "KSH" ? a.priceKsh : a.priceUsd),
      0,
    );
  const total = subtotal + addOnTotal;

  const adultsAllowed = adults <= property.maxOccupancy * rooms;
  const minNightOk = nights >= property.minNights;

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!nights) {
      setErr("Pick check-in and check-out dates.");
      return;
    }
    if (!minNightOk) {
      setErr(`This stay requires a ${property.minNights}-night minimum.`);
      return;
    }
    if (overlap) {
      setErr("Those dates conflict with another booking.");
      return;
    }
    if (!adultsAllowed) {
      setErr(
        `Max ${property.maxOccupancy} guests per room. Add another room or a Family unit.`,
      );
      return;
    }

    const fd = new FormData();
    fd.set("propertyId", property.id);
    fd.set("checkIn", checkIn);
    fd.set("checkOut", checkOut);
    fd.set("rooms", String(rooms));
    fd.set("adults", String(adults));
    fd.set("currency", currency);
    fd.set("subtotal", String(subtotal));
    fd.set("total", String(total));
    fd.set("addOns", JSON.stringify(selectedAddOns));
    bookProperty(fd);
  }

  return (
    <Card>
      <CardTitle>Book this stay</CardTitle>
      <CardSubtitle>
        Live availability. Prices update with weekends, add-ons, and occupancy.
      </CardSubtitle>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Check-in</Label>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Check-out</Label>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Rooms</Label>
            <Input
              type="number"
              min={1}
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Adults</Label>
            <Input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {(["KSH", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                currency === c
                  ? "bg-plum-900 text-plum-100"
                  : "bg-plum-900/5 text-plum-900"
              }`}
            >
              {c}
            </button>
          ))}
          {isWeekendStay && (
            <Badge tone="amber" className="ml-2">
              Weekend rate
            </Badge>
          )}
        </div>

        {addOns.length > 0 && (
          <div>
            <Label>Add-ons</Label>
            <div className="flex flex-col gap-2 mt-2">
              {addOns.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center justify-between rounded-2xl bg-plum-900/5 p-3 text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(a.id)}
                      onChange={() => toggleAddOn(a.id)}
                    />
                    {a.name}
                  </span>
                  <span>
                    {formatMoney(
                      currency === "KSH" ? a.priceKsh : a.priceUsd,
                      currency,
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {err && <Alert tone="danger">{err}</Alert>}

        <div className="rounded-2xl bg-plum-900/5 p-4 text-sm space-y-1">
          <p>
            {nights || "—"} night(s) × {formatMoney(nightly, currency)}
          </p>
          {isWeekendStay && (
            <p className="opacity-70">+15% weekend surcharge applied</p>
          )}
          <p className="font-medium pt-2 border-t border-plum-900/10">
            Total: {formatMoney(total, currency)}
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Confirm booking
        </Button>
      </form>
    </Card>
  );
}
