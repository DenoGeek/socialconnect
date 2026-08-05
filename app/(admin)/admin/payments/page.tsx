import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmPaymentManually } from "./actions";

export default async function PaymentsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const statusFilter = sp.status?.trim() || "";

  const rows = await db
    .select({
      payment: schema.payments,
      user: schema.users,
    })
    .from(schema.payments)
    .leftJoin(schema.users, eq(schema.users.id, schema.payments.userId))
    .orderBy(desc(schema.payments.createdAt))
    .limit(150);

  const filtered = statusFilter
    ? rows.filter(({ payment }) => payment.status === statusFilter)
    : rows;

  const pendingCount = rows.filter(({ payment }) =>
    payment.status === "pending" || payment.status === "processing",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Payments</h1>
        <p className="text-sm text-plum-900/60">
          TinyPesa / manual payment feed — provider refs, webhook payloads, and
          manual confirmation when a transfer needs human verification.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterChip href="/admin/payments" active={!statusFilter} label="All" />
        <FilterChip
          href="/admin/payments?status=processing"
          active={statusFilter === "processing"}
          label={`Processing (${rows.filter((r) => r.payment.status === "processing").length})`}
        />
        <FilterChip
          href="/admin/payments?status=pending"
          active={statusFilter === "pending"}
          label="Pending"
        />
        <FilterChip
          href="/admin/payments?status=succeeded"
          active={statusFilter === "succeeded"}
          label="Succeeded"
        />
        <FilterChip
          href="/admin/payments?status=failed"
          active={statusFilter === "failed"}
          label="Failed"
        />
      </div>

      {pendingCount > 0 && (
        <CardSubtitle>
          {pendingCount} payment(s) still awaiting confirmation.
        </CardSubtitle>
      )}

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
            <tr>
              <th className="py-2">When</th>
              <th>Provider</th>
              <th>Customer</th>
              <th>Subject</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Webhook / ref</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/8">
            {filtered.map(({ payment, user }) => {
              const webhookKeys = Object.keys(payment.rawWebhook ?? {});
              const canConfirm =
                payment.status === "pending" || payment.status === "processing";
              return (
                <tr key={payment.id}>
                  <td className="py-2 text-xs whitespace-nowrap">
                    {new Date(payment.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="text-xs">
                    <div>{payment.provider}</div>
                    <div className="text-plum-900/50 font-mono truncate max-w-[8rem]">
                      {payment.providerRef ?? "—"}
                    </div>
                  </td>
                  <td className="text-xs text-plum-900/70">
                    {user?.email ?? "—"}
                  </td>
                  <td>{payment.subjectKind}</td>
                  <td className="text-plum-900">
                    {payment.currency}{" "}
                    {Number(payment.amount).toLocaleString()}
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
                  <td className="text-xs text-plum-900/50 max-w-[12rem]">
                    {webhookKeys.length > 0 ? (
                      <details>
                        <summary className="cursor-pointer underline">
                          {webhookKeys.length} field(s)
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] max-h-32 overflow-auto">
                          {JSON.stringify(payment.rawWebhook, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {canConfirm && (
                      <form action={confirmPaymentManually}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <Button type="submit" variant="outline" className="text-xs">
                          Mark paid
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <CardSubtitle className="mt-3">No payments in this filter.</CardSubtitle>
        )}
      </Card>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1.5 transition ${
        active
          ? "bg-plum-900 text-plum-100"
          : "bg-plum-900/5 text-plum-900 hover:bg-plum-900/10"
      }`}
    >
      {label}
    </a>
  );
}
