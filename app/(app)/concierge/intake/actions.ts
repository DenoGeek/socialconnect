"use server";

import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function submitIntake(form: FormData) {
  const user = await requireUser();
  await db.insert(schema.conciergeIntakes).values({
    fullName: String(form.get("fullName")),
    email: String(form.get("email")),
    phone: String(form.get("phone")),
    requirements: String(form.get("requirements") ?? "") || undefined,
    convertedUserId: user.id,
    priority: "high",
  });
  redirect("/concierge?reserved=1");
}
