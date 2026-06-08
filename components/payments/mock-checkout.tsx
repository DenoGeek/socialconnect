"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils/format";
import { simulatePaymentSuccess } from "@/app/(app)/payments/actions";

export function MockCheckout({
  paymentId,
  amount,
  currency,
  label,
  successRedirect,
}: {
  paymentId: string;
  amount: number;
  currency: "KSH" | "USD";
  label: string;
  successRedirect?: string;
}) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();

  function handleSimulateSuccess() {
    setErr(null);
    start(() =>
      simulatePaymentSuccess(paymentId)
        .then(() => {
          setSuccess(true);
          if (successRedirect) {
            router.push(successRedirect);
          } else {
            router.refresh();
          }
        })
        .catch((e: unknown) =>
          setErr((e as Error).message ?? "Payment could not be confirmed."),
        ),
    );
  }

  if (success) {
    return (
      <Alert tone="success" className="mt-4">
        Payment successful. Thank you.
      </Alert>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-plum-900/10 pt-4">
      {err && <Alert tone="danger">{err}</Alert>}
      <p className="text-display text-2xl text-plum-900">
        {formatMoney(amount, currency)}
      </p>
      <p className="text-xs text-plum-900/50">{label}</p>
      <div>
        <Label htmlFor={`card-${paymentId}`}>Card number</Label>
        <Input
          id={`card-${paymentId}`}
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Expiry</Label>
          <Input defaultValue="12/28" readOnly />
        </div>
        <div>
          <Label>CVC</Label>
          <Input defaultValue="123" readOnly />
        </div>
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={handleSimulateSuccess}
      >
        {pending ? "Processing…" : "Pay now"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={handleSimulateSuccess}
      >
        Simulate success
      </Button>
    </div>
  );
}
