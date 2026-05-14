import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmPayment } from "../../actions";

export default async function ProfessionalBooking({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await requireUser();
  const [b] = await db
    .select()
    .from(schema.professionalBookings)
    .where(eq(schema.professionalBookings.id, bookingId))
    .limit(1);
  if (!b || b.primaryUserId !== user.id) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Your session</h1>
      </header>
      <Card>
        <CardTitle>Status</CardTitle>
        <Badge
          tone={b.paymentConfirmedAt ? "mint" : "amber"}
          className="mt-2"
        >
          {b.paymentConfirmedAt ? "Paid — session ready" : "Awaiting payment confirmation"}
        </Badge>
        <CardSubtitle className="mt-3">
          Pay the professional directly, then mark below. They&rsquo;ll be
          notified to begin.
        </CardSubtitle>
        {!b.paymentConfirmedAt && (
          <form action={confirmPayment} className="mt-3">
            <input type="hidden" name="bookingId" value={b.id} />
            <Button type="submit">I&rsquo;ve paid — start session</Button>
          </form>
        )}
      </Card>
      {b.videoLink && (
        <Card>
          <CardTitle>Tele-health link</CardTitle>
          <a
            href={b.videoLink}
            className="mt-2 inline-block underline text-plum-900"
            target="_blank"
          >
            Join secure video session →
          </a>
        </Card>
      )}
    </div>
  );
}
