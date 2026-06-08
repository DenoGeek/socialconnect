import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Avatar({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
    />
  );
}

export function AvatarImage({
  className,
  src,
  alt,
}: {
  className?: string;
  src?: string;
  alt?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={cn("aspect-square h-full w-full object-cover", className)}
    />
  );
}

export function AvatarFallback({
  className,
  children,
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-plum-100 text-xs font-semibold text-plum-900",
        className,
      )}
    >
      {children}
    </span>
  );
}
