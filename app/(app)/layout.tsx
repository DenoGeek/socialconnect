import { SiteHeader } from "@/components/brand/site-header";

/**
 * The (app) route group hosts authenticated-user areas. Auth gating
 * is enforced per-page via `requireSession()` (see `lib/auth/server.ts`)
 * because some routes here — like /events listings — are public.
 *
 * The proxy.ts handles cookie-level redirect for clearly private prefixes
 * (/profile, /matches, etc.) without a DB hit.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
