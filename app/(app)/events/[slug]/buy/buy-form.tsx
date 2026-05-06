"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { initiatePurchase } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { formatKes } from "@/lib/utils/format";

type Phase = "idle" | "submitting" | "polling" | "settled" | "failed";

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 90_000;

export function BuyForm({ tierId, amountKes }: { tierId: string; amountKes: number }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const msisdn = String(formData.get("msisdn") ?? "");
    setPhase("submitting");

    startTransition(async () => {
      const result = await initiatePurchase({ tierId, msisdn });
      if (!result.ok || !result.paymentId) {
        setPhase("failed");
        setError(result.error ?? "We couldn't start the payment. Try again.");
        return;
      }

      setPhase("polling");
      const started = Date.now();
      while (Date.now() - started < POLL_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const res = await fetch(`/api/payments/${result.paymentId}/status`, { cache: "no-store" });
        if (!res.ok) continue;
        const data = (await res.json()) as { status: string; ticketSlug?: string };
        if (data.status === "succeeded") {
          setPhase("settled");
          router.replace("/events/me?just=" + result.ticketPurchaseId);
          router.refresh();
          return;
        }
        if (data.status === "failed") {
          setPhase("failed");
          setError("M-Pesa rejected the request. The seat has been released.");
          return;
        }
      }
      setPhase("failed");
      setError("We didn't hear back from M-Pesa in time. If you completed the payment, your ticket will appear in 'My tickets' shortly.");
    });
  }

  if (phase === "polling" || phase === "submitting") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
        <p className="text-sm text-stone-700">
          {phase === "submitting" ? "Sending you the M-Pesa prompt…" : "Waiting for confirmation. Enter your PIN on your phone."}
        </p>
        <p className="text-xs text-stone-500">{formatKes(amountKes)} · keep this tab open</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="msisdn">M-Pesa phone number</Label>
        <Input
          id="msisdn"
          name="msisdn"
          type="tel"
          placeholder="07XX XXX XXX"
          autoComplete="tel"
          required
        />
        <p className="text-xs text-stone-500">We send the STK push to this number.</p>
      </div>
      <Button type="submit" disabled={pending} size="lg">
        Pay {formatKes(amountKes)} via M-Pesa
      </Button>
    </form>
  );
}
