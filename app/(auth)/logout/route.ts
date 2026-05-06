import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function GET() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
