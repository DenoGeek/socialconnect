import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  getCurrentUser,
  canAccessEcosystem,
  isStaffRole,
} from "@/lib/auth";
import { isRouterPrefetchRequest } from "@/lib/auth/request-kind";
import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";

export const dynamic = "force-dynamic";

const NAV_AMARI = [
  { href: "/profile", label: "Profile" },
  { href: "/events", label: "Pulse Hub" },
  { href: "/matches", label: "Matches" },
  { href: "/date-vault", label: "Date Vault" },
  { href: "/residential", label: "Hearth" },
  { href: "/programs", label: "Ascent" },
  { href: "/professionals", label: "Professionals" },
];

const NAV_ZAHARI = [
  { href: "/concierge", label: "Concierge" },
  { href: "/concierge/introductions", label: "Introductions" },
  { href: "/programs", label: "Ascent" },
  { href: "/professionals", label: "Professionals" },
];

const APPLY_PREFIX = "/apply";

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

  const pathname = h.get("x-pathname") ?? "";
  const onApplyFlow = pathname.startsWith(APPLY_PREFIX);
  const ecosystemOk = canAccessEcosystem(user);

  if (!ecosystemOk && !onApplyFlow && !isStaffRole(user.role)) {
    if (!isRouterPrefetchRequest(h)) {
      redirect("/apply");
    }
  }

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

  const isZahari = user.pathway === "zahari";
  const nav =
    isStaffRole(user.role) || !ecosystemOk
      ? [{ href: "/apply", label: "Application" }, { href: "/profile", label: "Profile" }]
      : isZahari
        ? NAV_ZAHARI
        : NAV_AMARI;

  return (
    <div className={isZahari ? "min-h-screen elite-bg" : "min-h-screen"}>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <Link
            href="/"
            className="block text-display text-2xl text-plum-900 mb-8"
          >
            Evermore
          </Link>
          <nav className="space-y-1">
            {nav.map((n) => (
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
