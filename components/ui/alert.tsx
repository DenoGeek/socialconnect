import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "success" }) {
  const variants = {
    default: "border-stone-200 bg-stone-50 text-stone-700",
    destructive: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  } as const;
  return (
    <div
      role="alert"
      className={cn("rounded-xl border px-4 py-3 text-sm", variants[variant], className)}
      {...props}
    />
  );
}
