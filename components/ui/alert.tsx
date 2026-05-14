import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "bg-plum-100/40 text-plum-900 border-plum-100",
  success: "bg-mint-soft text-plum-900 border border-mint",
  warning: "bg-amber-soft text-plum-900 border border-amber",
  danger: "bg-red-100/60 text-red-900 border-red-200",
};

export function Alert({
  tone = "info",
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      {...rest}
      role="alert"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    />
  );
}
