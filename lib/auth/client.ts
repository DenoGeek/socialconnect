import { createAuthClient } from "better-auth/react";

function resolveAuthClientBaseURL(): string | undefined {
  // In the browser, always use the page origin (port + host, including LAN).
  // Better Auth otherwise prefers NEXT_PUBLIC_BETTER_AUTH_URL from env before
  // window.location; a stale value (e.g. :3000 while dev runs on :3003)
  // makes requests fail with TypeError: Failed to fetch.
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    undefined
  );
}

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
