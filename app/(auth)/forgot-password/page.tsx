import { ForgotForm } from "./forgot-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-display text-2xl text-plum-900 mb-2">
        Reset password
      </h1>
      <p className="text-sm text-plum-900/60 mb-6">
        We&rsquo;ll send a reset link to your email.
      </p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm text-plum-900/60">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
