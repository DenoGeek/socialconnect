import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "muted" | "success" | "warning" }) {
  const variants = {
    default: "bg-stone-900 text-stone-50",
    muted: "bg-stone-100 text-stone-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
