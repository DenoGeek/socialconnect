"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils/format";
import { simulatePaymentSuccess } from "@/app/(app)/payments/actions";

export function SimulateCheckout({
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
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleSimulate() {
    setErr(null);
    start(() =>
      simulatePaymentSuccess(paymentId)
        .then(({ redirectTo }) => {
          router.push(successRedirect ?? redirectTo);
        })
        .catch((e: unknown) =>
          setErr((e as Error).message ?? "Payment could not be confirmed."),
        ),
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-plum-900/10 pt-4">
      {err && <Alert tone="danger">{err}</Alert>}
      <p className="text-display text-2xl text-plum-900">
        {formatMoney(amount, currency)}
      </p>
      <p className="text-xs text-plum-900/50">{label}</p>
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={handleSimulate}
      >
        {pending ? "Processing…" : "Simulate payment"}
      </Button>
    </div>
  );
}
