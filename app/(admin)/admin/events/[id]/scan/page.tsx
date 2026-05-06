import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scanner } from "./scanner";
import { formatEventDate } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Check in · Admin" };

export default async function ScanPage({ params }: PageProps) {
  const { id } = await params;
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  return (
    <section className="flex flex-col gap-6 p-8">
      <Link
        href="/admin/events"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
      >
        ← Events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Check in · {event.title}</CardTitle>
          <p className="text-xs text-stone-500">
            {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
          </p>
        </CardHeader>
        <CardContent>
          <Scanner />
        </CardContent>
      </Card>
    </section>
  );
}
