import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, ticketTiers } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatKes } from "@/lib/utils/format";
import { requireSession } from "@/lib/auth/server";
import { BuyForm } from "./buy-form";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tier?: string }>;
}

export default async function BuyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  await requireSession();

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) notFound();

  const [tier] = sp.tier
    ? await db.select().from(ticketTiers).where(eq(ticketTiers.id, sp.tier)).limit(1)
    : await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id)).limit(1);
  if (!tier || tier.eventId !== event.id) notFound();

  const remaining = tier.maxQty - tier.soldQty;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-12">
      <Link
        href={`/events/${event.slug}`}
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Back to event
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {tier.name} · {formatKes(tier.priceKes)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {remaining <= 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This tier just sold out. Check the event page for other options.
            </p>
          ) : (
            <>
              <p className="text-sm text-stone-600">
                We&apos;ll send an M-Pesa STK push to your phone. Enter your PIN to confirm — keep
                this tab open until you see the confirmation.
              </p>
              <BuyForm tierId={tier.id} amountKes={tier.priceKes} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
