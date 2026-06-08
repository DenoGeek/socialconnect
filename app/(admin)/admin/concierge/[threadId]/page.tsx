import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { AppLink } from "@/components/nav/app-link";

export default async function ConciergeThreadAdmin({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  await requireAdmin();
  const [thread] = await db
    .select()
    .from(schema.conciergeThreads)
    .where(eq(schema.conciergeThreads.id, threadId))
    .limit(1);
  if (!thread) notFound();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, thread.userId))
    .limit(1);

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <AppLink
          href="/admin/concierge"
          className="text-xs text-plum-900/60 hover:text-plum-900"
        >
          ← Back to inbox
        </AppLink>
        <h1 className="text-display text-3xl text-plum-900 mt-2">
          {user?.name ?? "Member"}
        </h1>
        <p className="text-sm text-plum-900/60">{user?.email}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {user?.pathway === "zahari" && <Badge tone="amber">Zahari</Badge>}
          {user?.tier === "elite" && <Badge tone="amber">Elite</Badge>}
          {thread.conciergeOnDuty && <Badge tone="mint">On duty</Badge>}
        </div>
      </header>

      <Card className="border-mint bg-mint-soft">
        <CardTitle>Live chat</CardTitle>
        <CardSubtitle className="mt-2">
          Hover the concierge bubble at the bottom-right to pick a thread, or
          open this member&apos;s chat directly from the list.
        </CardSubtitle>
        <AppLink
          href="/admin/concierge"
          className="mt-3 inline-block text-sm text-plum-700 underline hover:text-plum-900"
        >
          Return to inbox
        </AppLink>
      </Card>
    </div>
  );
}
