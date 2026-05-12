import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-3xl bg-white border border-plum-900/8 shadow-sm p-6",
        className,
      )}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cn("text-xl text-display text-plum-900 mb-2", className)}
    />
  );
}

export function CardSubtitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...rest} className={cn("text-sm text-plum-900/60", className)} />
  );
}
