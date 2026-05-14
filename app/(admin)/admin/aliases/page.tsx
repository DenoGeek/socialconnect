import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAliasToPool, manualOverride } from "./actions";

export default async function AliasesAdmin() {
  await requireAdmin();
  const pool = await db
    .select()
    .from(schema.aliasPool)
    .orderBy(desc(schema.aliasPool.createdAt))
    .limit(100);

  const assignments = await db
    .select({
      assignment: schema.aliasAssignments,
      alias: schema.aliasPool,
      user: schema.users,
    })
    .from(schema.aliasAssignments)
    .innerJoin(
      schema.aliasPool,
      eq(schema.aliasPool.id, schema.aliasAssignments.aliasId),
    )
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.aliasAssignments.userId),
    )
    .orderBy(desc(schema.aliasAssignments.assignedAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Alias manager</h1>
        <p className="text-sm text-plum-900/60">
          Add to the pool, manually override clashes, view a user&rsquo;s alias
          timeline.
        </p>
      </header>

      <Card>
        <CardTitle>Add to pool</CardTitle>
        <form action={addAliasToPool} className="mt-3 flex gap-2">
          <Input name="name" placeholder="The Cartographer" required />
          <Input name="archetype" placeholder="Archetype (optional)" />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Recent assignments</CardTitle>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Alias</th>
              <th>User (real)</th>
              <th>Event</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {assignments.map((a) => (
              <tr key={a.assignment.id}>
                <td className="py-2 font-display text-base">{a.alias.name}</td>
                <td className="text-xs">{a.user.email}</td>
                <td className="text-xs">{a.assignment.eventId ?? "—"}</td>
                <td>
                  <form action={manualOverride} className="flex gap-1">
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={a.assignment.id}
                    />
                    <select
                      name="newAliasId"
                      className="rounded-full bg-plum-900/5 px-2 py-1 text-xs"
                      required
                    >
                      {pool
                        .filter((p) => p.id !== a.alias.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button className="rounded-full bg-plum-900 text-plum-100 px-2 py-1 text-xs">
                      Override
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Privacy seal</CardTitle>
        <p className="text-sm text-plum-900/60">
          Exports of this table strip aliases or real names — never both.
        </p>
      </Card>
    </div>
  );
}
