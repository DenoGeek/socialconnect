import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  addPartner,
  addDeal,
  togglePartner,
  toggleDeal,
} from "./actions";

export default async function PartnersAdmin() {
  await requireAdmin();
  const partners = await db
    .select()
    .from(schema.datePartners)
    .orderBy(desc(schema.datePartners.createdAt));
  const deals = await db
    .select({
      deal: schema.dateVaultDeals,
      partner: schema.datePartners,
    })
    .from(schema.dateVaultDeals)
    .innerJoin(
      schema.datePartners,
      eq(schema.datePartners.id, schema.dateVaultDeals.partnerId),
    )
    .orderBy(desc(schema.dateVaultDeals.createdAt));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">
          Partners & Date Vault
        </h1>
        <p className="text-sm text-plum-900/60">
          Toggle a partner inactive to instantly pull all their deals from the
          rotation.
        </p>
      </header>

      <Card>
        <CardTitle>Add partner</CardTitle>
        <form action={addPartner} className="mt-3 grid grid-cols-2 gap-2">
          <Input name="name" placeholder="Partner name" required />
          <Input name="category" placeholder="restaurant / spa / chef" required />
          <Input name="city" placeholder="City" />
          <Input name="contactEmail" placeholder="Contact email" />
          <Button type="submit" className="col-span-2">
            Add partner
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Partners</CardTitle>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Name</th>
              <th>Category</th>
              <th>City</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {partners.map((p) => (
              <tr key={p.id}>
                <td className="py-2">{p.name}</td>
                <td>{p.category}</td>
                <td>{p.city ?? "—"}</td>
                <td>
                  <Badge tone={p.active ? "mint" : "neutral"}>
                    {p.active ? "active" : "inactive"}
                  </Badge>
                </td>
                <td>
                  <form action={togglePartner}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs underline text-plum-900">
                      Toggle
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Add deal</CardTitle>
        <form action={addDeal} className="mt-3 space-y-3">
          <select
            name="partnerId"
            required
            className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">Pick a partner…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input name="title" placeholder="Deal title" required />
          <Input name="description" placeholder="Short description" />
          <div className="grid grid-cols-2 gap-2">
            <Input name="originalPriceKsh" placeholder="Original KSh" />
            <Input name="memberPriceKsh" placeholder="Member KSh" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input name="discountCode" placeholder="Discount code" />
            <Input name="thumbnail" placeholder="Image URL" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input name="vibeTags" placeholder="Tags (comma-separated)" />
            <select
              name="spendingTier"
              className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
            >
              <option value="standard">standard</option>
              <option value="premium">premium</option>
              <option value="elite">elite</option>
            </select>
          </div>
          <Label>Expires at</Label>
          <Input name="expiresAt" type="date" />
          <Button type="submit">Add deal</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Deals</CardTitle>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">Deal</th>
              <th>Partner</th>
              <th>Tier</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {deals.map(({ deal, partner }) => (
              <tr key={deal.id}>
                <td className="py-2">{deal.title}</td>
                <td>{partner.name}</td>
                <td>{deal.spendingTier}</td>
                <td>
                  <Badge tone={deal.active ? "mint" : "neutral"}>
                    {deal.active ? "active" : "inactive"}
                  </Badge>
                </td>
                <td>
                  <form action={toggleDeal}>
                    <input type="hidden" name="id" value={deal.id} />
                    <button className="text-xs underline text-plum-900">
                      Toggle
                    </button>
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
