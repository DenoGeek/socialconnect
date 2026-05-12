import { createAuthClient } from "better-auth/react";

// Default to same-origin so the client works regardless of which port the
// dev server actually chose. Only override when explicitly configured.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
});

export const { signIn, signUp, signOut, useSession } = authClient;
