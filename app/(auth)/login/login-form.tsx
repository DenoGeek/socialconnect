"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectTo ?? "/",
      });
      if (error) {
        setError(error.message ?? "Sign in failed");
        return;
      }
      router.replace(redirectTo ?? "/");
      router.refresh();
    });
  }

  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo ?? "/",
    });
    if (error) {
      setError(error.message ?? "Google sign in failed");
      setGooglePending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="relative my-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <Button type="button" variant="outline" size="lg" disabled={googlePending} onClick={handleGoogle}>
        {googlePending ? "Redirecting…" : "Continue with Google"}
      </Button>
    </form>
  );
}
