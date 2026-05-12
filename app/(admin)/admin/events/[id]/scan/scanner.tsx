"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export function Scanner() {
  const containerId = "scanner-box";
  const [result, setResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = new Html5QrcodeScanner(
      containerId,
      { fps: 10, qrbox: 240 },
      false,
    );
    s.render(
      (text) => {
        setResult(text);
        s.pause(true);
      },
      () => {},
    );
    scannerRef.current = s;
    return () => {
      s.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-3">
      <div id={containerId} className="overflow-hidden rounded-2xl" />
      {result && (
        <div className="rounded-2xl bg-plum-900/5 p-3 text-xs font-mono break-all">
          Scanned: {result}
        </div>
      )}
    </div>
  );
}
