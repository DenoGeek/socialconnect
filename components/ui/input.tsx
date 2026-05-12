import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      {...rest}
      className={cn(
        "w-full rounded-2xl border border-plum-900/15 bg-white px-4 py-2.5 text-sm text-plum-900 placeholder:text-plum-900/40 focus:border-plum-900 focus:outline-none focus:ring-2 focus:ring-plum-900/10",
        className,
      )}
    />
  );
});
