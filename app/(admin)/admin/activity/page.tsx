import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminActivityPage() {
  await requireAdmin();

  const rows = await db
    .select({
      log: schema.auditLog,
      actor: schema.users,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorUserId))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(150);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Activity</h1>
        <p className="text-sm text-plum-900/60">
          Who approved applications, ran matching, or switched modes — recent
          staff and system actions.
        </p>
      </header>

      <Card>
        <CardTitle>Recent actions ({rows.length})</CardTitle>
        {rows.length === 0 ? (
          <CardSubtitle className="mt-3">No activity logged yet.</CardSubtitle>
        ) : (
          <table className="w-full text-sm mt-3">
            <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
              <tr>
                <th className="py-2">When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum-900/8">
              {rows.map(({ log, actor }) => (
                <tr key={log.id}>
                  <td className="py-2 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="text-xs text-plum-900/70">
                    {actor?.email ?? actor?.name ?? "—"}
                  </td>
                  <td>
                    <Badge tone="neutral">{log.action}</Badge>
                  </td>
                  <td className="text-xs font-mono text-plum-900/60 max-w-[10rem] truncate">
                    {log.target ?? "—"}
                  </td>
                  <td className="text-xs text-plum-900/50 max-w-[16rem] truncate">
                    {Object.keys(log.diff ?? {}).length > 0
                      ? JSON.stringify(log.diff)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
