import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-stone-200/60 px-6 py-5">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900">
          Evermore · Agano
        </Link>
      </header>
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
