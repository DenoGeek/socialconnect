import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  getCurrentUser,
  canAccessEcosystem,
  isStaffRole,
  isEliteExperience,
} from "@/lib/auth";
import { isRouterPrefetchRequest } from "@/lib/auth/request-kind";
import { isZahariSubscriptionActive } from "@/lib/membership/zahari-status";
import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { MobileNavDrawer } from "@/components/nav/mobile-nav-drawer";
import { MemberConciergeFloaterShell } from "@/components/concierge/member-concierge-floater-shell";

export const dynamic = "force-dynamic";

const NAV_AMARI = [
  { href: "/profile", label: "Profile" },
  { href: "/account", label: "Account" },
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
  ...NAV_AMARI,
];

const APPLY_PREFIX = "/apply";
const CREATE_PROFILE_PREFIX = "/profile/onboarding";
const ZAHARI_PRE_DASHBOARD_PREFIXES = [
  "/apply",
  "/account",
  "/concierge/zahari",
  "/payments",
  "/profile",
];

function isZahariPreDashboardPath(pathname: string) {
  return ZAHARI_PRE_DASHBOARD_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

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
  const onCreateProfile = pathname.startsWith(CREATE_PROFILE_PREFIX);
  const ecosystemOk = canAccessEcosystem(user);

  if (!ecosystemOk && !isStaffRole(user.role)) {
    // The journey/tier flow is locked until the profile is complete.
    const [profileRow] = await db
      .select({ completedAt: schema.profiles.onboardingCompletedAt })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);
    const profileComplete = profileRow?.completedAt != null;
    if (!isRouterPrefetchRequest(h)) {
      if (!profileComplete && !onCreateProfile) {
        redirect("/profile/onboarding");
      }
      if (profileComplete && !onApplyFlow && !onCreateProfile) {
        redirect("/apply");
      }
    }
  }

  // Zahari: interview → pay → dashboard. Unpaid members stay on journey rails.
  if (
    ecosystemOk &&
    user.pathway === "zahari" &&
    !isStaffRole(user.role) &&
    !isRouterPrefetchRequest(h)
  ) {
    const [eng] = await db
      .select()
      .from(schema.zahariEngagements)
      .where(eq(schema.zahariEngagements.userId, user.id))
      .limit(1);
    if (!isZahariSubscriptionActive(eng) && !isZahariPreDashboardPath(pathname)) {
      if (eng?.status === "pending_payment") {
        redirect("/concierge/zahari/pay");
      }
      redirect("/apply/status");
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
  const eliteChrome = isEliteExperience(user);
  const mainClassName = isZahari
    ? "flex-1 min-w-0 elite-main-panel"
    : "flex-1 min-w-0";

  const nav =
    isStaffRole(user.role) || !ecosystemOk
      ? [{ href: "/apply", label: "Application" }, { href: "/profile", label: "Profile" }]
      : isZahari
        ? NAV_ZAHARI
        : NAV_AMARI;

  return (
    <div className={isZahari ? "min-h-screen elite-bg" : "min-h-screen"}>
      <MobileNavDrawer
        title="Evermore"
        nav={nav}
        eliteChrome={eliteChrome}
        adminHref={
          user.role === "admin" ||
          user.role === "super_admin" ||
          user.role === "concierge"
            ? "/admin"
            : undefined
        }
        facilitatorHref={user.role === "facilitator" ? "/facilitator" : undefined}
        hostHref={user.role === "host" ? "/host" : undefined}
      />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <Link
            href="/"
            className={`block text-display text-2xl mb-8 ${
              eliteChrome ? "elite-sidebar-title" : "text-plum-900"
            }`}
          >
            Evermore
          </Link>
          <nav className="space-y-1">
            {nav.map((n) => (
              <AppLink
                key={n.href}
                href={n.href}
                className={`block rounded-xl px-3 py-2 text-sm ${
                  eliteChrome
                    ? "elite-nav-link"
                    : "text-plum-900/80 hover:bg-plum-900/5 hover:text-plum-900"
                }`}
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
            <SignOutButton
              className={`mt-2 block w-full text-left rounded-xl px-3 py-2 text-sm ${
                eliteChrome
                  ? "elite-nav-link opacity-80"
                  : "text-plum-900/50 hover:text-plum-900"
              }`}
            />
          </nav>
        </aside>
        <main className={mainClassName}>
          {children}
        </main>
      </div>
      {ecosystemOk && (
        <MemberConciergeFloaterShell
          user={{
            id: user.id,
            pathway: user.pathway,
            tier: user.tier,
            role: user.role,
          }}
        />
      )}
    </div>
  );
}
