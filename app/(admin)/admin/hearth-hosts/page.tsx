import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addHearthHost, toggleHearthHost, removeHearthHost } from "./actions";

export default async function HearthHostsPage() {
  await requireAdmin();
  const hosts = await db.select().from(schema.hosts);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Hearth property hosts</h1>
        <p className="text-sm text-plum-900/60">
          Residential hosts for Connection Box properties — separate from event host role.
        </p>
      </header>

      <Card>
        <CardTitle>Add host</CardTitle>
        <form action={addHearthHost} className="mt-4 grid grid-cols-2 gap-2">
          <Input name="legalName" placeholder="Legal name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="phone" placeholder="Phone" />
          <Input name="userId" placeholder="Linked user id (optional)" />
          <label className="col-span-2 text-sm flex items-center gap-2">
            <input type="checkbox" name="approved" /> Approved
          </label>
          <Button type="submit" className="col-span-2">
            Add host
          </Button>
        </form>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {hosts.map((h) => (
              <tr key={h.id}>
                <td className="py-2">{h.legalName}</td>
                <td>{h.email}</td>
                <td>
                  <Badge tone={h.approved ? "mint" : "neutral"}>
                    {h.approved ? "approved" : "pending"}
                  </Badge>
                </td>
                <td className="space-x-2 text-right">
                  <form action={toggleHearthHost} className="inline">
                    <input type="hidden" name="id" value={h.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Toggle
                    </Button>
                  </form>
                  <form action={removeHearthHost} className="inline">
                    <input type="hidden" name="id" value={h.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-700">
                      Remove
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
