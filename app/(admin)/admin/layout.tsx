import { AppLink } from "@/components/nav/app-link";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { MobileNavDrawer } from "@/components/nav/mobile-nav-drawer";
import { requireAdmin } from "@/lib/auth";
import { StaffConciergeFloater } from "@/components/concierge/staff-concierge-floater";

const NAV = [
  { href: "/admin", label: "Command" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/hosts", label: "Event hosts" },
  { href: "/admin/hearth-hosts", label: "Hearth hosts" },
  { href: "/admin/zahari", label: "Zahari" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/aliases", label: "Aliases" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/properties", label: "Hearth" },
  { href: "/admin/concierge", label: "Concierge" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/flags", label: "Safety" },
  { href: "/admin/kill-switch", label: "Kill switch" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen bg-plum-50">
      <MobileNavDrawer
        title="Evermore"
        subtitle={user.role.replace("_", " ")}
        nav={NAV}
      />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <AppLink href="/admin" className="block text-display text-2xl text-plum-900 mb-2">
            Evermore
          </AppLink>
          <p className="text-xs uppercase tracking-widest text-plum-900/50 mb-6">
            {user.role.replace("_", " ")}
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
      <StaffConciergeFloater staffUserId={user.id} />
    </div>
  );
}
