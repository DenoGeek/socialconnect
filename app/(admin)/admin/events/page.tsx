import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/utils/format";

export const metadata = { title: "Events admin · Evermore" };

export default async function AdminEventsPage() {
  const all = await db.select().from(events).orderBy(desc(events.startsAt));

  return (
    <section className="flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-stone-500">Create, edit, and check people in.</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">New event</Link>
        </Button>
      </header>

      {all.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-stone-500">
            No events yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {all.map((event) => (
            <li key={event.id}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <p className="text-xs text-stone-500">
                        {formatEventDate(event.startsAt, event.endsAt)} · {event.city}
                      </p>
                    </div>
                    <StatusPill status={event.status} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/events/${event.id}/scan`}>Check in</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/events/${event.slug}`} target="_blank">Public page ↗</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "published") return <Badge variant="success">Published</Badge>;
  if (status === "draft") return <Badge variant="muted">Draft</Badge>;
  if (status === "sold_out") return <Badge variant="warning">Sold out</Badge>;
  if (status === "completed") return <Badge variant="muted">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="muted">Cancelled</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}
