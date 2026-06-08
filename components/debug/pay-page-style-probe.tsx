"use client";

import { useEffect } from "react";

export function PayPageStyleProbe() {
  useEffect(() => {
    const main = document.querySelector("main");
    const h1 = document.querySelector("main h1");
    const cardTitle = document.querySelector("main .text-display");
    const mainStyle = main ? getComputedStyle(main) : null;
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const cardStyle = cardTitle ? getComputedStyle(cardTitle) : null;

    // #region agent log
    fetch("http://127.0.0.1:7405/ingest/eb375903-b24c-4ad4-9d65-edd096cd3d7f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "851db9",
      },
      body: JSON.stringify({
        sessionId: "851db9",
        location: "pay-page-style-probe.tsx:mount",
        message: "computed styles on pay page",
        data: {
          mainClass: main?.className ?? null,
          mainBg: mainStyle?.backgroundColor ?? null,
          mainColor: mainStyle?.color ?? null,
          h1Color: h1Style?.color ?? null,
          h1Text: h1?.textContent?.slice(0, 40) ?? null,
          cardTitleColor: cardStyle?.color ?? null,
          shellBg: getComputedStyle(document.body).backgroundColor,
        },
        timestamp: Date.now(),
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return null;
}
