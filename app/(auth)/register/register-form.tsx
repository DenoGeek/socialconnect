"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!name || !email || password.length < 8) {
      setError("Please complete every field. Passwords must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: redirectTo ?? "/profile",
      });
      if (error) {
        setError(error.message ?? "Could not create your account");
        return;
      }
      router.replace(redirectTo ?? "/profile");
      router.refresh();
    });
  }

  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo ?? "/profile",
    });
    if (error) {
      setError(error.message ?? "Google sign-up failed");
      setGooglePending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-stone-500">8 characters minimum.</p>
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Creating…" : "Create account"}
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
