import Link from "next/link";
import { getSession } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getSession();
  const role = session?.user.role ?? "user";
  const name = session?.user.name ?? "";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-stone-50/85 px-6 py-4 backdrop-blur">
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900">
        Evermore · Agano
      </Link>

      <nav className="hidden items-center gap-6 text-sm text-stone-600 sm:flex">
        <Link href="/events" className="hover:text-stone-900">
          Events
        </Link>
        {session && (
          <Link href="/matches" className="hover:text-stone-900">
            Matches
          </Link>
        )}
        <Link href="/concierge" className="hover:text-stone-900">
          Concierge
        </Link>
        <Link href="/programs" className="hover:text-stone-900">
          Programs
        </Link>
        <Link href="/residential" className="hover:text-stone-900">
          Residential
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            {(role === "admin" || role === "concierge") && (
              <Link
                href="/admin"
                className="hidden text-xs uppercase tracking-wide text-stone-500 hover:text-stone-900 sm:inline"
              >
                Admin
              </Link>
            )}
            <Link href="/profile" className="hidden text-sm text-stone-700 hover:text-stone-900 sm:inline">
              {name.split(" ")[0] || "Profile"}
            </Link>
            <form action="/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hidden text-sm text-stone-700 hover:text-stone-900 sm:inline">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Join</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
