"use client";

import { useState } from "react";
import type { Event, EventTicket } from "@/db/schema";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils/format";
import { purchaseTicket } from "./actions";

export function BuyForm({
  event,
  ticket,
  userId,
}: {
  event: Event;
  ticket: EventTicket;
  userId: string;
}) {
  const [currency, setCurrency] = useState<"KSH" | "USD">("KSH");
  const [provider, setProvider] = useState<"tinypesa" | "mpesa" | "card">(
    "tinypesa",
  );
  const [phone, setPhone] = useState("");

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Purchase: {ticket.label}
        </h1>
        <p className="text-sm text-plum-900/60">{event.title}</p>
      </header>

      <Card>
        <CardTitle>Choose your currency</CardTitle>
        <CardSubtitle>
          Pay in KSh via M-Pesa or in USD via card. Toggle to see your price.
        </CardSubtitle>
        <div className="mt-4 flex gap-2">
          {(["KSH", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                currency === c
                  ? "bg-plum-900 text-plum-100"
                  : "bg-plum-900/5 text-plum-900"
              }`}
              data-testid={`currency-${c}`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="mt-4 text-display text-3xl text-plum-900">
          {formatMoney(
            currency === "KSH" ? ticket.priceKsh : ticket.priceUsd,
            currency,
          )}
        </p>
      </Card>

      <form action={purchaseTicket} className="space-y-4">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <input type="hidden" name="eventId" value={event.id} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="userId" value={userId} />

        <Card>
          <CardTitle>Payment method</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(currency === "KSH"
              ? (["tinypesa", "mpesa"] as const)
              : (["card"] as const)
            ).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`rounded-full px-4 py-2 text-sm uppercase tracking-widest text-xs transition ${
                  provider === p
                    ? "bg-plum-900 text-plum-100"
                    : "bg-plum-900/5 text-plum-900"
                }`}
              >
                {p === "tinypesa" ? "M-Pesa (TinyPesa)" : p}
              </button>
            ))}
          </div>
          <input type="hidden" name="provider" value={provider} />

          {currency === "KSH" && (
            <div className="mt-4">
              <Label>M-Pesa number</Label>
              <Input
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                required={currency === "KSH"}
              />
            </div>
          )}
        </Card>

        <Button type="submit" className="w-full" size="lg">
          Confirm purchase
        </Button>
        <p className="text-xs text-plum-900/50">
          The charge will appear from <strong>Evermore Events</strong> — never
          a personal name.
        </p>
      </form>
    </div>
  );
}
