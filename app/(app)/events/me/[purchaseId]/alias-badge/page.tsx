import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getAlias } from "@/lib/alias/assign";

export default async function AliasBadgePage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const user = await requireUser();
  const [purchase] = await db
    .select()
    .from(schema.ticketPurchases)
    .where(eq(schema.ticketPurchases.id, purchaseId))
    .limit(1);
  if (!purchase || purchase.userId !== user.id) notFound();
  const alias = await getAlias(user.id, purchase.eventId);

  return (
    <div className="max-w-md mx-auto">
      <div
        className="aspect-[9/16] rounded-[2rem] p-10 flex flex-col items-center justify-between text-plum-100"
        style={{
          background:
            "linear-gradient(160deg, #380b38 0%, #4c1148 70%, #f6b754 200%)",
        }}
      >
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.6em] opacity-70">
            Evermore Pulse
          </p>
          <p className="text-xs uppercase tracking-widest opacity-70 mt-1">
            Event Alias
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-70">
            I am
          </p>
          <h2 className="text-display text-5xl mt-2">
            {alias?.alias.name ?? "—"}
          </h2>
        </div>
        <p className="text-xs uppercase tracking-[0.4em] opacity-70 text-center">
          Until we meet
        </p>
      </div>
      <p className="text-center text-xs text-plum-900/60 mt-3">
        Screenshot this for your Story.
      </p>
    </div>
  );
}
