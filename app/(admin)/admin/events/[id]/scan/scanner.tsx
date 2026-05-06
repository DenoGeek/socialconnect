"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScanResult =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "success"; name: string; eventTitle: string; alreadyCheckedIn: boolean }
  | { kind: "error"; message: string };

export function Scanner() {
  const [result, setResult] = useState<ScanResult>({ kind: "idle" });
  const [cameraOn, setCameraOn] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const lastScanRef = useRef<string>("");

  async function checkIn(token: string) {
    if (!token || token === lastScanRef.current) return;
    lastScanRef.current = token;
    setResult({ kind: "scanning" });
    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(token)}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setResult({ kind: "error", message: data.reason ?? "Could not check in this ticket." });
        return;
      }
      const lookup = await fetch(`/api/qr/${encodeURIComponent(token)}`);
      const lookupData = await lookup.json();
      const name = lookupData.ticket?.attendeeName ?? "Guest";
      const eventTitle = lookupData.ticket?.eventTitle ?? "";
      setResult({
        kind: "success",
        name,
        eventTitle,
        alreadyCheckedIn: !!data.alreadyCheckedIn,
      });
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
    // Allow the same token to be re-scanned after 2s
    setTimeout(() => {
      lastScanRef.current = "";
    }, 2000);
  }

  useEffect(() => {
    if (!cameraOn || !containerRef.current) return;
    const elementId = "qr-reader";
    let stopped = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5 = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = { stop: () => html5.stop().catch(() => {}) };

      await html5
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (!stopped) checkIn(decoded);
          },
          () => {
            // Decode failures are noisy and expected per frame; ignore.
          },
        )
        .catch((err: Error) => {
          setResult({ kind: "error", message: err.message ?? "Could not access camera." });
        });
    })();

    return () => {
      stopped = true;
      scannerRef.current?.stop();
      scannerRef.current = null;
    };
  }, [cameraOn]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {!cameraOn ? (
          <Button onClick={() => setCameraOn(true)} size="lg">
            Start camera
          </Button>
        ) : (
          <Button onClick={() => setCameraOn(false)} variant="outline">
            Stop camera
          </Button>
        )}
        <div
          id="qr-reader"
          ref={containerRef}
          className="aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-black"
        />
      </div>

      {result.kind === "success" && (
        <Alert variant="success">
          <p className="font-medium">
            {result.alreadyCheckedIn ? "Already checked in" : "Welcome"} — {result.name}
          </p>
          {result.eventTitle && <p className="text-xs opacity-80">{result.eventTitle}</p>}
        </Alert>
      )}
      {result.kind === "error" && <Alert variant="destructive">{result.message}</Alert>}
      {result.kind === "scanning" && <Alert>Checking…</Alert>}

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-700">
          Enter token manually
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkIn(manualToken.trim());
          }}
          className="mt-3 flex gap-2"
        >
          <div className="flex-1">
            <Label className="sr-only" htmlFor="manual-token">QR token</Label>
            <Input
              id="manual-token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste the JWT from the ticket"
            />
          </div>
          <Button type="submit" size="sm">Check in</Button>
        </form>
      </details>
    </div>
  );
}
