import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center text-display text-3xl text-plum-100 mb-10"
        >
          Evermore
        </Link>
        <div className="rounded-3xl bg-white/95 p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
