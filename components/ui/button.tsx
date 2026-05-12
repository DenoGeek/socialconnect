import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "ghost" | "outline" | "danger" | "elite";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-900 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-plum-900 text-plum-100 hover:bg-plum-700 active:scale-[.99] shadow-sm",
  ghost:
    "bg-transparent text-plum-900 hover:bg-plum-900/5",
  outline:
    "border border-plum-900/20 bg-white text-plum-900 hover:border-plum-900/40",
  danger: "bg-red-600 text-white hover:bg-red-700",
  elite:
    "bg-amber text-plum-900 hover:opacity-90 shadow",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-6 py-3",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(base, variants[variant], sizes[size], className)}
    />
  );
}
