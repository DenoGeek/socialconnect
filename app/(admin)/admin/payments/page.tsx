import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PaymentsAdmin() {
  await requireAdmin();
  const rows = await db
    .select({
      payment: schema.payments,
      user: schema.users,
    })
    .from(schema.payments)
    .leftJoin(
      schema.users,
      eq(schema.users.id, schema.payments.userId),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Payments</h1>
        <p className="text-sm text-plum-900/60">
          Provider, status, sender display (business name — never personal).
        </p>
      </header>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">When</th>
              <th>From (display)</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {rows.map(({ payment, user }) => (
              <tr key={payment.id}>
                <td className="py-2 text-xs">
                  {new Date(payment.createdAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td>{payment.senderDisplayName}</td>
                <td className="text-xs text-plum-900/70">{user?.email ?? "—"}</td>
                <td>{payment.subjectKind}</td>
                <td className="text-plum-900">
                  {payment.currency} {Number(payment.amount).toLocaleString()}
                </td>
                <td>
                  <Badge
                    tone={
                      payment.status === "succeeded"
                        ? "mint"
                        : payment.status === "failed"
                          ? "neutral"
                          : "amber"
                    }
                  >
                    {payment.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
