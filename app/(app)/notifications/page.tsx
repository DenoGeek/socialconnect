import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/nav/app-link";
import { markNotificationsRead } from "@/app/(app)/matches/[matchId]/contact-actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await db
    .select()
    .from(schema.inAppNotifications)
    .where(eq(schema.inAppNotifications.userId, user.id))
    .orderBy(desc(schema.inAppNotifications.createdAt))
    .limit(50);

  const unread = notes.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl text-plum-900">Notifications</h1>
          <p className="text-sm text-plum-900/60 mt-1">
            In-app alerts for matches, announcements, and safety notices.
            {unread > 0 ? ` · ${unread} unread` : ""}
          </p>
        </div>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <Button type="submit" size="sm" variant="outline">
              Mark all read
            </Button>
          </form>
        )}
      </header>

      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id}>
            <Card className={n.readAt ? "opacity-70" : ""}>
              <div className="flex gap-2 items-center">
                <Badge tone={n.kind === "warning" || n.kind === "safety" ? "amber" : "mint"}>
                  {n.kind}
                </Badge>
                {!n.readAt && <Badge tone="plum">New</Badge>}
              </div>
              <CardTitle className="mt-2 text-lg">{n.title}</CardTitle>
              <CardSubtitle className="mt-1">{n.body}</CardSubtitle>
              <p className="text-[10px] text-plum-900/40 mt-2">
                {new Date(n.createdAt).toLocaleString("en-GB")}
              </p>
              {n.href && (
                <AppLink href={n.href} className="text-sm underline mt-2 inline-block">
                  Open →
                </AppLink>
              )}
            </Card>
          </li>
        ))}
        {notes.length === 0 && (
          <Card>
            <CardTitle>No notifications yet</CardTitle>
            <CardSubtitle>Announcements and match alerts will appear here.</CardSubtitle>
          </Card>
        )}
      </ul>
    </div>
  );
}
