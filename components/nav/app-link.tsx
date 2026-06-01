import Link from "next/link";
import type { ComponentProps } from "react";
import { isProtectedHref } from "@/lib/nav/protected-paths";

type AppLinkProps = ComponentProps<typeof Link>;

function hrefToPath(href: AppLinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (typeof href === "object" && href.pathname) return href.pathname;
  return "";
}

function hrefToAnchor(href: AppLinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (typeof href === "object" && href.pathname) {
    const q =
      href.query && typeof href.query === "object"
        ? `?${new URLSearchParams(href.query as Record<string, string>)}`
        : "";
    return `${href.pathname}${q}`;
  }
  return "";
}

/**
 * Use inside authenticated app shells. Protected targets use a full document
 * navigation (`<a>`) so the session cookie is always sent in production.
 */
export function AppLink({ href, children, ...rest }: AppLinkProps) {
  const path = hrefToPath(href);
  if (path && isProtectedHref(path)) {
    const {
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      ...anchorProps
    } = rest;
    return (
      <a href={hrefToAnchor(href)} {...anchorProps}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
