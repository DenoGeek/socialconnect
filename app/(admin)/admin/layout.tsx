import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "concierge"]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 sm:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b border-stone-200 bg-stone-50 p-6 sm:w-56 sm:border-b-0 sm:border-r">
        <Link href="/" className="mb-6 text-[11px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900">
          ← Back to site
        </Link>
        <span className="text-xs uppercase tracking-wide text-stone-500">Admin</span>
        <NavLink href="/admin">Overview</NavLink>
        <NavLink href="/admin/events">Events</NavLink>
        <NavLink href="/admin/concierge">Concierge queue</NavLink>
        <NavLink href="/admin/concierge/intakes">Intakes</NavLink>
        <NavLink href="/admin/partners">Partners</NavLink>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-2 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900"
    >
      {children}
    </Link>
  );
}
