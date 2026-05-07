import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setPartnerStatus } from "./actions";

export const metadata = { title: "Partners · Admin" };

const STATUSES = ["pending", "approved", "suspended"] as const;
type Status = (typeof STATUSES)[number];

export default async function PartnersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status: Status = STATUSES.includes(sp.status as Status)
    ? (sp.status as Status)
    : "pending";

  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.status, status))
    .orderBy(desc(partners.createdAt));

  return (
    <section className="flex flex-col gap-6 p-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partners</h1>
          <p className="text-sm text-stone-500">
            Churches, counsellors, retreat hosts. Approve a partner before their programs and
            properties go live.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/partners?status=${s}`}
              className={`rounded-full border px-3 py-1 capitalize transition-colors ${
                status === s
                  ? "border-stone-900 bg-stone-900 text-stone-50"
                  : "border-stone-300 text-stone-700 hover:border-stone-500"
              }`}
            >
              {s}
            </Link>
          ))}
        </nav>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-stone-500">
            Nothing in this state.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((partner) => (
            <li key={partner.id}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{partner.name}</CardTitle>
                      <p className="text-xs text-stone-500">
                        {partner.contactEmail ?? "No contact email"}
                        {partner.city ? ` · ${partner.city}` : ""}
                      </p>
                    </div>
                    <Badge variant={status === "approved" ? "success" : "muted"}>
                      {partner.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  {partner.description && (
                    <p className="basis-full text-sm text-stone-700">{partner.description}</p>
                  )}
                  <div className="ml-auto flex gap-2">
                    {partner.status !== "approved" && (
                      <ActionForm
                        partnerId={partner.id}
                        nextStatus="approved"
                        label="Approve"
                        variant="default"
                      />
                    )}
                    {partner.status !== "suspended" && (
                      <ActionForm
                        partnerId={partner.id}
                        nextStatus="suspended"
                        label="Suspend"
                        variant="destructive"
                      />
                    )}
                    {partner.status === "suspended" && (
                      <ActionForm
                        partnerId={partner.id}
                        nextStatus="pending"
                        label="Move to pending"
                        variant="outline"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionForm({
  partnerId,
  nextStatus,
  label,
  variant,
}: {
  partnerId: string;
  nextStatus: "pending" | "approved" | "suspended";
  label: string;
  variant: "default" | "outline" | "destructive";
}) {
  const action = setPartnerStatus.bind(null, partnerId);
  return (
    <form action={action}>
      <input type="hidden" name="status" value={nextStatus} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
