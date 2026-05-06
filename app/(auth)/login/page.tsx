import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Sign in · Evermore" };

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();
  const sp = await searchParams;
  if (session) redirect(sp.redirect ?? "/");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-stone-500">Sign in to continue your journey.</p>
      </header>
      <LoginForm redirectTo={sp.redirect} />
      <p className="text-center text-sm text-stone-500">
        New here?{" "}
        <Link
          href={`/register${sp.redirect ? `?redirect=${encodeURIComponent(sp.redirect)}` : ""}`}
          className="font-medium text-stone-900 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
