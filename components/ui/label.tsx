import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props;
  return (
    <label
      {...rest}
      className={cn(
        "block text-xs font-medium uppercase tracking-wider text-plum-900/70 mb-1.5",
        className,
      )}
    />
  );
}
