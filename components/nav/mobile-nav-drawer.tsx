"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";

export type NavItem = { href: string; label: string };

export function MobileNavDrawer({
  title,
  nav,
  eliteChrome = false,
  subtitle,
  adminHref,
  facilitatorHref,
  hostHref,
}: {
  title: string;
  nav: NavItem[];
  eliteChrome?: boolean;
  subtitle?: string;
  adminHref?: string;
  facilitatorHref?: string;
  hostHref?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = eliteChrome
    ? "elite-nav-link block rounded-xl px-3 py-2 text-sm"
    : "block rounded-xl px-3 py-2 text-sm text-plum-900/80 hover:bg-plum-900/5 hover:text-plum-900";

  const panelClass = eliteChrome
    ? "elite-bg border-r border-amber/20"
    : "bg-plum-50 border-r border-plum-900/10";

  const titleClass = eliteChrome ? "elite-sidebar-title" : "text-plum-900";

  return (
    <>
      <div
        className={`md:hidden sticky top-0 z-40 border-b px-4 py-3 backdrop-blur ${
          eliteChrome
            ? "elite-bg border-amber/20"
            : "border-plum-900/10 bg-plum-50/95"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className={`text-display text-xl ${titleClass}`}>
            {title}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-plum-900/10 bg-white text-plum-900"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col p-4 shadow-xl ${panelClass}`}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <Link
                  href="/"
                  className={`block text-display text-2xl ${titleClass}`}
                  onClick={() => setOpen(false)}
                >
                  {title}
                </Link>
                {subtitle && (
                  <p
                    className={`mt-1 text-xs uppercase tracking-widest ${
                      eliteChrome ? "text-plum-100/60" : "text-plum-900/50"
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  eliteChrome
                    ? "text-plum-100 hover:bg-white/10"
                    : "text-plum-900 hover:bg-plum-900/5"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {nav.map((n) => (
                <AppLink
                  key={n.href}
                  href={n.href}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </AppLink>
              ))}
              {adminHref && (
                <AppLink
                  href={adminHref}
                  className="mt-4 block rounded-xl bg-plum-900 px-3 py-2 text-sm font-medium text-plum-100"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </AppLink>
              )}
              {facilitatorHref && (
                <AppLink
                  href={facilitatorHref}
                  className="mt-4 block rounded-xl bg-mint px-3 py-2 text-sm font-medium text-plum-900"
                  onClick={() => setOpen(false)}
                >
                  The Lab
                </AppLink>
              )}
              {hostHref && (
                <AppLink
                  href={hostHref}
                  className="mt-4 block rounded-xl bg-teal px-3 py-2 text-sm font-medium text-white"
                  onClick={() => setOpen(false)}
                >
                  Host portal
                </AppLink>
              )}
            </nav>

            <SignOutButton
              className={`mt-4 block w-full rounded-xl px-3 py-2 text-left text-sm ${
                eliteChrome
                  ? "elite-nav-link opacity-80"
                  : "text-plum-900/50 hover:text-plum-900"
              }`}
            />
          </aside>
        </div>
      )}
    </>
  );
}
