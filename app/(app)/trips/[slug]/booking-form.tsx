"use client";

import { useState } from "react";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils/format";
import { bookTrip } from "./actions";

export function TripBookingForm({
  trip,
  userId,
}: {
  trip: {
    id: string;
    slug: string;
    totalUsd: number;
    totalKsh: number;
  };
  userId: string;
}) {
  const [installments, setInstallments] = useState(1);
  const [currency, setCurrency] = useState<"USD" | "KSH">("USD");

  const total = currency === "USD" ? trip.totalUsd : trip.totalKsh;
  const perInstallment = Math.round(total / installments);

  return (
    <Card>
      <CardTitle>Reserve your spot</CardTitle>
      <CardSubtitle>
        Pick currency and installment plan. We&rsquo;ll nudge you 3 days before
        each due date.
      </CardSubtitle>
      <form action={bookTrip} className="mt-4 space-y-4">
        <input type="hidden" name="tripId" value={trip.id} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="total" value={String(total)} />

        <div className="flex gap-2">
          {(["USD", "KSH"] as const).map((c) => (
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
        </div>

        <div>
          <Label>Installments</Label>
          <select
            name="installmentMonths"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
          >
            <option value={1}>Pay in full</option>
            <option value={2}>2 months</option>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
          </select>
        </div>

        <div className="rounded-2xl bg-plum-900/5 p-4 text-sm space-y-1">
          <p>Total: {formatMoney(total, currency)}</p>
          {installments > 1 && (
            <p>
              {installments} × {formatMoney(perInstallment, currency)}
            </p>
          )}
        </div>

        <div>
          <Label>Travel document (passport/visa) — encrypted vault</Label>
          <Input type="file" name="document" />
          <p className="text-xs text-plum-900/50 mt-1">
            Files stay encrypted and visible only to you and the Concierge.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Reserve
        </Button>
      </form>
    </Card>
  );
}
