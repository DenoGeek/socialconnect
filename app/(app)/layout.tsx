import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

const NAV = [
  { href: "/profile", label: "Profile" },
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
              <Link
                key={n.href}
                href={n.href}
                className="block rounded-xl px-3 py-2 text-sm text-plum-900/80 hover:bg-plum-900/5 hover:text-plum-900"
              >
                {n.label}
              </Link>
            ))}
            {(user.role === "admin" || user.role === "super_admin" || user.role === "concierge") && (
              <Link
                href="/admin"
                className="mt-4 block rounded-xl bg-plum-900 px-3 py-2 text-sm font-medium text-plum-100"
              >
                Admin
              </Link>
            )}
            {user.role === "facilitator" && (
              <Link
                href="/facilitator"
                className="mt-4 block rounded-xl bg-mint px-3 py-2 text-sm font-medium text-plum-900"
              >
                The Lab
              </Link>
            )}
            {user.role === "host" && (
              <Link
                href="/host"
                className="mt-4 block rounded-xl bg-teal px-3 py-2 text-sm font-medium text-white"
              >
                Host portal
              </Link>
            )}
            <Link
              href="/logout"
              className="mt-2 block rounded-xl px-3 py-2 text-sm text-plum-900/50 hover:text-plum-900"
            >
              Sign out
            </Link>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
