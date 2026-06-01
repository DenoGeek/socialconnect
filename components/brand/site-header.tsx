import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AppLink } from "@/components/nav/app-link";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-plum-900/8 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-display text-xl text-plum-900 tracking-tight"
        >
          Evermore
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-plum-900/70">
          <AppLink href="/events" className="hover:text-plum-900">
            Pulse
          </AppLink>
          <AppLink href="/residential" className="hover:text-plum-900">
            Hearth
          </AppLink>
          <AppLink href="/date-vault" className="hover:text-plum-900">
            Date Vault
          </AppLink>
          <AppLink href="/programs" className="hover:text-plum-900">
            Ascent
          </AppLink>
          <AppLink href="/concierge" className="hover:text-plum-900">
            Concierge
          </AppLink>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <AppLink
              href="/profile"
              className="text-sm text-plum-900 underline-offset-4 hover:underline"
            >
              {user.name?.split(" ")[0] ?? "Profile"}
            </AppLink>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-plum-900/70 hover:text-plum-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-plum-900 px-4 py-2 text-sm font-medium text-plum-100 hover:bg-plum-700"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
