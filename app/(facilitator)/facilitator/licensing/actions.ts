"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireFacilitator } from "@/lib/auth";

export async function submitLicensingApplication(form: FormData) {
  const me = await requireFacilitator();
  const photos = String(form.get("photos") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  await db.insert(schema.licensingApplications).values({
    applicantUserId: me.id,
    propertyName: String(form.get("propertyName")),
    photos,
    complianceChecklist: {
      cleanlinessVerified: form.get("cleanlinessVerified") === "on",
      safetyVerified: form.get("safetyVerified") === "on",
      connectionBoxReady: form.get("connectionBoxReady") === "on",
      aestheticAligned: form.get("aestheticAligned") === "on",
    },
    licensingFeePct: 15,
  });
  revalidatePath("/facilitator/licensing");
}
