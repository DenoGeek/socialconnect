import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { isRouterPrefetchRequest } from "@/lib/auth/request-kind";
import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/profile", label: "Profile" },
  { href: "/profile/membership", label: "Membership" },
  { href: "/events", label: "Pulse Hub" },
  { href: "/matches", label: "Matches" },
  { href: "/residential", label: "Hearth" },
  { href: "/date-vault", label: "Date Vault" },
  { href: "/programs", label: "Ascent" },
  { href: "/professionals", label: "Professionals" },
  { href: "/trips", label: "Trips" },
  { href: "/concierge", label: "Concierge" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const user = await getCurrentUser();
  if (!user) {
    if (isRouterPrefetchRequest(h)) {
      return <div className="min-h-screen" aria-hidden="true" />;
    }
    const pathname = h.get("x-pathname");
    redirect(
      pathname
        ? `/login?redirect=${encodeURIComponent(pathname)}`
        : "/login",
    );
  }

  // Regional kill switch.
  const userCountry = "KE";
  const [killed] = await db
    .select()
    .from(schema.regionalKillSwitches)
    .where(
      and(
        eq(schema.regionalKillSwitches.region, userCountry),
        eq(schema.regionalKillSwitches.active, true),
      ),
    )
    .limit(1);

  if (killed) {
    return (
      <main className="min-h-screen brand-bg flex items-center justify-center p-8">
        <div className="max-w-md text-center text-plum-100">
          <p className="text-xs uppercase tracking-[0.4em] mb-3 opacity-70">
            Service paused
          </p>
          <h1 className="text-display text-4xl mb-3">We&rsquo;re briefly offline in {userCountry}.</h1>
          <p className="opacity-80">{killed.reason ?? "Scheduled maintenance."}</p>
        </div>
      </main>
    );
  }

  // Side bar varies subtly for Elite tier.
  const isElite = user.tier === "elite";

  return (
    <div className={isElite ? "min-h-screen elite-bg" : "min-h-screen"}>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <Link
            href="/"
            className="block text-display text-2xl text-plum-900 mb-8"
          >
            Evermore
          </Link>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <AppLink
                key={n.href}
                href={n.href}
                className="block rounded-xl px-3 py-2 text-sm text-plum-900/80 hover:bg-plum-900/5 hover:text-plum-900"
              >
                {n.label}
              </AppLink>
            ))}
            {(user.role === "admin" || user.role === "super_admin" || user.role === "concierge") && (
              <AppLink
                href="/admin"
                className="mt-4 block rounded-xl bg-plum-900 px-3 py-2 text-sm font-medium text-plum-100"
              >
                Admin
              </AppLink>
            )}
            {user.role === "facilitator" && (
              <AppLink
                href="/facilitator"
                className="mt-4 block rounded-xl bg-mint px-3 py-2 text-sm font-medium text-plum-900"
              >
                The Lab
              </AppLink>
            )}
            {user.role === "host" && (
              <AppLink
                href="/host"
                className="mt-4 block rounded-xl bg-teal px-3 py-2 text-sm font-medium text-white"
              >
                Host portal
              </AppLink>
            )}
            <SignOutButton className="mt-2 block w-full text-left rounded-xl px-3 py-2 text-sm text-plum-900/50 hover:text-plum-900" />
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
