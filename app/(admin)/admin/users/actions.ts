"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { signTicketToken } from "@/lib/utils/qr";

const USER_TIERS = new Set(["free", "explorer", "couple", "elite", "concierge"]);

export async function updateUserTier(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("userId"));
  const tier = String(form.get("tier"));
  if (!USER_TIERS.has(tier)) {
    throw new Error("Invalid tier");
  }

  await db
    .update(schema.users)
    .set({ tier: tier as "free" | "explorer" | "couple" | "elite" | "concierge", updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function deleteUserAccount(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("userId"));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function grantDiscountedTicket(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("userId"));
  const ticketId = String(form.get("ticketId"));
  const discountPct = Number(form.get("discountPct") ?? 0);
  const currency = String(form.get("currency") ?? "KSH") as "KSH" | "USD";

  if (discountPct < 0 || discountPct > 100) {
    throw new Error("Discount must be between 0 and 100");
  }

  const [ticket] = await db
    .select()
    .from(schema.eventTickets)
    .where(eq(schema.eventTickets.id, ticketId))
    .limit(1);
  if (!ticket) throw new Error("Ticket not found");
  const eventId = ticket.eventId;

  const base = currency === "KSH" ? Number(ticket.priceKsh) : Number(ticket.priceUsd);
  const finalAmount = Math.max(0, base - base * (discountPct / 100));
  const code = `ADM-${randomBytes(4).toString("hex").toUpperCase()}`;
  const tempId = randomBytes(8).toString("hex");
  const qrToken = signTicketToken({ ticketCode: code, userId, eventId, jti: tempId });

  await db.insert(schema.ticketPurchases).values({
    userId,
    eventId,
    ticketId,
    code,
    qrToken,
    status: "confirmed",
    currency,
    amount: finalAmount.toFixed(2),
  });

  revalidatePath(`/admin/users/${userId}`);
}
