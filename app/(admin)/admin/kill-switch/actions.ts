"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function toggleSwitch(form: FormData) {
  const me = await requireAdmin();
  const region = String(form.get("region")).toUpperCase();
  const reason = (form.get("reason") as string) || undefined;

  const [existing] = await db
    .select()
    .from(schema.regionalKillSwitches)
    .where(eq(schema.regionalKillSwitches.region, region))
    .limit(1);
  if (existing) {
    await db
      .update(schema.regionalKillSwitches)
      .set({
        active: sql`NOT ${schema.regionalKillSwitches.active}`,
        reason,
        toggledByUserId: me.id,
        toggledAt: new Date(),
      })
      .where(eq(schema.regionalKillSwitches.id, existing.id));
  } else {
    await db.insert(schema.regionalKillSwitches).values({
      region,
      active: true,
      reason,
      toggledByUserId: me.id,
    });
  }
  revalidatePath("/admin/kill-switch");
}
