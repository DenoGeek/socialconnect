import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[88px] w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm leading-relaxed text-stone-900 transition-colors placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
