import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Create account · Evermore" };

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const session = await getSession();
  const sp = await searchParams;
  if (session) redirect(sp.redirect ?? "/");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Begin quietly</h1>
        <p className="text-sm text-stone-500">A profile takes a few minutes. Then come the events.</p>
      </header>
      <RegisterForm redirectTo={sp.redirect} />
      <p className="text-center text-sm text-stone-500">
        Already have one?{" "}
        <Link
          href={`/login${sp.redirect ? `?redirect=${encodeURIComponent(sp.redirect)}` : ""}`}
          className="font-medium text-stone-900 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
