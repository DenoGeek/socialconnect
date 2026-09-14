import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendAnnouncement } from "../ops-actions";

export default async function AnnouncementsPage() {
  await requireAdmin();

  const events = await db
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.startsAt))
    .limit(40);

  const past = await db
    .select()
    .from(schema.announcements)
    .orderBy(desc(schema.announcements.sentAt))
    .limit(20);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Announcements</h1>
        <p className="text-sm text-plum-900/60">
          Email + in-app. Respects member opt-out of community updates.
        </p>
      </header>

      <Card>
        <CardTitle>Send broadcast</CardTitle>
        <form action={sendAnnouncement} className="mt-4 space-y-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full rounded-2xl border px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            required
            placeholder="Message"
            className="w-full rounded-2xl border px-3 py-2 text-sm min-h-28"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-plum-900/60">
              Pathway
              <select
                name="pathwayFilter"
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
                defaultValue="everyone"
              >
                <option value="everyone">Everyone</option>
                <option value="amari">Amari only</option>
                <option value="zahari">Zahari only</option>
              </select>
            </label>
            <label className="text-xs text-plum-900/60">
              City filter (optional)
              <input
                name="cityFilter"
                placeholder="e.g. Nairobi"
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-plum-900/60 sm:col-span-2">
              Event attendees (optional)
              <select
                name="eventIdFilter"
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">All (no event filter)</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="sendEmail" defaultChecked className="size-4" />
              Email
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="sendInApp" defaultChecked className="size-4" />
              In-app
            </label>
          </div>
          <Button type="submit">Send announcement</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Recent sends</CardTitle>
        <ul className="mt-3 divide-y text-sm">
          {past.map((a) => (
            <li key={a.id} className="py-3">
              <div className="flex gap-2 items-center">
                <Badge tone="mint">{a.pathwayFilter}</Badge>
                <span className="text-xs text-plum-900/40">
                  {a.recipientCount} recipients
                </span>
              </div>
              <p className="font-medium mt-1">{a.title}</p>
              <CardSubtitle className="mt-1">{a.body}</CardSubtitle>
              <p className="text-[10px] text-plum-900/40 mt-1">
                {new Date(a.sentAt).toLocaleString("en-GB")}
              </p>
            </li>
          ))}
          {past.length === 0 && (
            <li className="py-2 text-plum-900/50">No announcements yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
