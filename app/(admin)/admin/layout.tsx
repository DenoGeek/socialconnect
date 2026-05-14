import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Command" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/aliases", label: "Aliases" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/properties", label: "Hearth" },
  { href: "/admin/concierge", label: "Concierge" },
  { href: "/admin/payments", label: "Payments" },
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
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <Link href="/admin" className="block text-display text-2xl text-plum-900 mb-2">
            Evermore
          </Link>
          <p className="text-xs uppercase tracking-widest text-plum-900/50 mb-6">
            {user.role.replace("_", " ")}
          </p>
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
            <Link
              href="/logout"
              className="mt-4 block rounded-xl px-3 py-2 text-sm text-plum-900/50 hover:text-plum-900"
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
