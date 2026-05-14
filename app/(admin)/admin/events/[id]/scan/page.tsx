import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scanner } from "./scanner";
import { checkInTicket } from "../../actions";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [e] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  if (!e) notFound();

  const purchases = await db
    .select()
    .from(schema.ticketPurchases)
    .where(eq(schema.ticketPurchases.eventId, e.id));
  const total = purchases.length;
  const checkedIn = purchases.filter((p) => p.status === "checked_in").length;
  const noShow = purchases.filter((p) => p.status === "no_show").length;

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{e.title}</h1>
        <CardSubtitle>Live check-in</CardSubtitle>
        <div className="mt-3 flex gap-3 flex-wrap">
          <Badge tone="mint">{checkedIn} in</Badge>
          <Badge tone="neutral">{total - checkedIn} pending</Badge>
          {noShow > 0 && <Badge tone="amber">{noShow} no-show</Badge>}
        </div>
      </header>

      <Card>
        <CardTitle>Scanner</CardTitle>
        <Scanner />
      </Card>

      <Card>
        <CardTitle>Manual check-in</CardTitle>
        <form action={checkInTicket} className="mt-2 flex gap-2">
          <input
            name="code"
            placeholder="EVR-XXXXX"
            required
            className="flex-1 rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm uppercase"
          />
          <button className="rounded-full bg-plum-900 text-plum-100 px-4 py-2 text-sm">
            Check in
          </button>
        </form>
      </Card>
    </div>
  );
}
