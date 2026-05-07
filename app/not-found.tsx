import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-16 text-center">
      <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400">404</span>
      <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
        We&apos;ve looked everywhere. This page isn&apos;t here.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-stone-500">
        The link may have moved, or the page may not exist yet. A few good places to start instead:
      </p>
      <nav className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/events">Events</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/concierge">Concierge</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
      </nav>
    </main>
  );
}
