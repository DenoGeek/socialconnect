import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { MobileNavDrawer } from "@/components/nav/mobile-nav-drawer";
import { requireFacilitator } from "@/lib/auth";

const NAV = [
  { href: "/facilitator", label: "Lab" },
  { href: "/facilitator/cohorts", label: "Cohorts" },
  { href: "/facilitator/curriculum", label: "Curriculum" },
  { href: "/facilitator/showcase", label: "Showcase" },
  { href: "/facilitator/licensing", label: "B2B Licensing" },
];

export default async function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireFacilitator();
  return (
    <div className="min-h-screen bg-plum-50">
      <MobileNavDrawer
        title="The Lab"
        subtitle={user.email ?? undefined}
        nav={NAV}
      />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <AppLink
            href="/facilitator"
            className="block text-display text-2xl text-plum-900 mb-2"
          >
            The Lab
          </AppLink>
          <p className="text-xs uppercase tracking-widest text-plum-900/50 mb-6">
            {user.email}
          </p>
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
            <SignOutButton className="mt-4 block w-full text-left rounded-xl px-3 py-2 text-sm text-plum-900/50 hover:text-plum-900" />
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
