"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, partners } from "@/db/schema";
import { requireRole } from "@/lib/auth/server";

const setStatusSchema = z.object({
  status: z.enum(["pending", "approved", "suspended"]),
});

export async function setPartnerStatus(partnerId: string, formData: FormData) {
  const session = await requireRole(["admin"]);
  const parsed = setStatusSchema.parse({ status: formData.get("status") });

  await db
    .update(partners)
    .set({
      status: parsed.status,
      approvedAt: parsed.status === "approved" ? new Date() : null,
      approvedBy: parsed.status === "approved" ? session.user.id : null,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId));

  await db.insert(auditLog).values({
    actorUserId: session.user.id,
    action: `partner.${parsed.status}`,
    resourceType: "partner",
    resourceId: partnerId,
  });

  revalidatePath("/admin/partners");
}
