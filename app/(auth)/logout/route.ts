import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/utils/public-origin";

// POST only: signing out mutates state, so it must not be a GET. A GET handler
// here gets prefetched by the router (the "Sign out" link), which would run the
// sign-out and wipe the session right after login. See components/nav/sign-out-button.
export async function POST(req: Request) {
  const h = await headers();
  await auth.api.signOut({ headers: h });
  // 303 so the browser follows the redirect as a GET.
  return NextResponse.redirect(`${getPublicOrigin(req)}/`, { status: 303 });
}
