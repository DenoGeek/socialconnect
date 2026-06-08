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
          Agano Evermore
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-plum-900/70">
          <Link href="/" className="hover:text-plum-900">
            Home
          </Link>
          <Link href="/story" className="hover:text-plum-900">
            Our Story
          </Link>
          <Link href="/ecosystem" className="hover:text-plum-900">
            Ecosystem
          </Link>
          <Link href="/circles" className="hover:text-plum-900">
            Circles
          </Link>
          <Link href="/journey" className="hover:text-plum-900">
            Journey
          </Link>
          <Link href="/resources" className="hover:text-plum-900">
            Resources
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <AppLink
              href={
                user.vettingStatus === "approved"
                  ? user.pathway === "zahari"
                    ? "/concierge"
                    : "/profile"
                  : "/apply/status"
              }
              className="text-sm text-plum-900 underline-offset-4 hover:underline"
            >
              Dashboard
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
                Create profile
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
