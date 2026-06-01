import { AppLink } from "@/components/nav/app-link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminEvents() {
  await requireAdmin();
  const events = await db
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.startsAt));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-display text-3xl text-plum-900">Events</h1>
          <p className="text-sm text-plum-900/60">CMS for Pulse retreats.</p>
        </div>
        <AppLink href="/admin/events/new">
          <Button>New event</Button>
        </AppLink>
      </header>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Title</th>
              <th>When</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="py-3">
                  <p className="text-plum-900">{e.title}</p>
                  <p className="text-xs text-plum-900/50">{e.city}</p>
                </td>
                <td>
                  {new Date(e.startsAt).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>
                  <Badge
                    tone={e.status === "published" ? "mint" : "neutral"}
                  >
                    {e.status}
                  </Badge>
                  {e.eliteOnly && (
                    <Badge tone="amber" className="ml-1">
                      Elite
                    </Badge>
                  )}
                </td>
                <td className="space-x-2">
                  <AppLink
                    href={`/admin/events/${e.id}/edit`}
                    className="text-xs underline text-plum-900"
                  >
                    Edit
                  </AppLink>
                  <AppLink
                    href={`/admin/events/${e.id}/scan`}
                    className="text-xs underline text-plum-900"
                  >
                    Check-in
                  </AppLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
