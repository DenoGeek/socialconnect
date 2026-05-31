"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { startMembershipUpgrade } from "./actions";

export function UpgradeForm({
  planSlug,
  planLabel,
  priceKsh,
}: {
  planSlug: string;
  planLabel: string;
  priceKsh: number;
}) {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const fd = new FormData();
    fd.set("plan", planSlug);
    fd.set("phone", phone);
    start(() =>
      startMembershipUpgrade(fd)
        .then((r) => {
          setMsg(
            `STK Push sent for ${planLabel} (KES ${priceKsh.toLocaleString()}). Complete payment on your phone. Reference: ${r.paymentId.slice(0, 8)}…`,
          );
        })
        .catch((e: unknown) =>
          setErr((e as Error).message ?? "Payment could not start."),
        ),
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-plum-900/10 pt-4">
      {err && <Alert tone="danger">{err}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}
      <div>
        <Label htmlFor={`phone-${planSlug}`}>M-Pesa phone</Label>
        <Input
          id={`phone-${planSlug}`}
          name="phone"
          placeholder="2547XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending STK…" : `Pay KES ${priceKsh.toLocaleString()} via M-Pesa`}
      </Button>
    </form>
  );
}
