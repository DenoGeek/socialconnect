import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <>
      <h1 className="text-display text-2xl text-plum-900 mb-2">Welcome back</h1>
      <p className="text-sm text-plum-900/60 mb-6">
        Pick up where you left off in the ecosystem.
      </p>
      <LoginForm searchParamsPromise={searchParams} />
      <p className="mt-6 text-center text-sm text-plum-900/60">
        New here?{" "}
        <Link href="/register" className="text-plum-900 font-medium underline">
          Begin your journey
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-plum-900/60">
        <Link href="/forgot-password" className="underline">
          Forgot your password?
        </Link>
      </p>
    </>
  );
}
