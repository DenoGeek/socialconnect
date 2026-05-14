import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-display text-2xl text-plum-900 mb-2">
        Begin your journey
      </h1>
      <p className="text-sm text-plum-900/60 mb-6">
        Create an account to step into Evermore.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-plum-900/60">
        Already have an account?{" "}
        <Link href="/login" className="text-plum-900 font-medium underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
