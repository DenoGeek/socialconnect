import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const h = await headers();
  await auth.api.signOut({ headers: h });
  const url = new URL("/", req.url);
  return NextResponse.redirect(url);
}

export const POST = GET;
