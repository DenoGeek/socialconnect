import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { assignHostRole, removeHostRole } from "./actions";

export default async function AdminHostsPage() {
  await requireAdmin();

  const allUsers = await db.select().from(schema.users);
  const hosts = allUsers.filter((u) => u.role === "host");
  const nonHosts = allUsers.filter((u) => u.role !== "host");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Hosts</h1>
        <p className="text-sm text-plum-900/60">
          Add and remove host access for event operations.
        </p>
      </header>

      <Card>
        <CardTitle>Current hosts ({hosts.length})</CardTitle>
        {hosts.length === 0 ? (
          <CardSubtitle className="mt-3">No hosts assigned yet.</CardSubtitle>
        ) : (
          <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
            {hosts.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <span>
                  {u.name} · <span className="text-plum-900/60">{u.email}</span>
                </span>
                <form action={removeHostRole}>
                  <input type="hidden" name="userId" value={u.id} />
                  <Button type="submit" variant="ghost">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Add host</CardTitle>
        <form action={assignHostRole} className="mt-3 flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-plum-900/50 mb-1">
              User
            </label>
            <select
              name="userId"
              className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
              required
            >
              <option value="">Select a user</option>
              {nonHosts.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.email}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Assign host</Button>
        </form>
      </Card>
    </div>
  );
}
