import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "plum" | "mint" | "teal" | "amber" | "neutral";

const tones: Record<Tone, string> = {
  plum: "bg-plum-900 text-plum-100",
  mint: "bg-mint text-plum-900",
  teal: "bg-teal text-white",
  amber: "bg-amber text-plum-900",
  neutral: "bg-plum-900/5 text-plum-900",
};

export function Badge({
  tone = "plum",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    />
  );
}
