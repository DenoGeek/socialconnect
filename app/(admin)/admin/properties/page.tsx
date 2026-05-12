import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PropertiesAdmin() {
  await requireAdmin();
  const rows = await db
    .select()
    .from(schema.hearthProperties)
    .orderBy(desc(schema.hearthProperties.createdAt));
  const bookings = await db
    .select()
    .from(schema.hearthBookings)
    .orderBy(desc(schema.hearthBookings.createdAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Hearth</h1>
        <p className="text-sm text-plum-900/60">
          Manage own units and certified external hosts.
        </p>
      </header>

      <Card>
        <CardTitle>Properties</CardTitle>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Title</th>
              <th>Region</th>
              <th>Certified</th>
              <th>Rate (KSh)</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2">{p.title}</td>
                <td>{p.region}</td>
                <td>
                  {p.aganoCertified ? (
                    <Badge tone="mint">Certified</Badge>
                  ) : (
                    <Badge tone="neutral">No</Badge>
                  )}
                </td>
                <td>{Number(p.nightlyRateKsh).toLocaleString("en-KE")}</td>
                <td>
                  <Badge tone={p.active ? "mint" : "neutral"}>
                    {p.active ? "yes" : "no"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Recent bookings</CardTitle>
        <ul className="mt-3 divide-y divide-plum-900/8 text-sm">
          {bookings.map((b) => (
            <li key={b.id} className="flex justify-between py-2">
              <span>
                {new Date(b.checkIn).toLocaleDateString("en-GB")} →{" "}
                {new Date(b.checkOut).toLocaleDateString("en-GB")}
              </span>
              <Badge
                tone={b.status === "confirmed" ? "mint" : "neutral"}
              >
                {b.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
