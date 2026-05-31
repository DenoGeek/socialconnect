import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/utils/public-origin";

export async function GET(req: Request) {
  const h = await headers();
  await auth.api.signOut({ headers: h });
  return NextResponse.redirect(`${getPublicOrigin(req)}/`);
}

export const POST = GET;
