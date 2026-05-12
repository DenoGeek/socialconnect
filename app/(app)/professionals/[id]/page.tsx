import { notFound } from "next/navigation";
import { eq, asc, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { quickChat, bookSession, confirmPayment } from "./actions";

export default async function ProfessionalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [p] = await db
    .select()
    .from(schema.professionals)
    .where(eq(schema.professionals.id, id))
    .limit(1);
  if (!p) notFound();

  const slots = await db
    .select()
    .from(schema.professionalAvailability)
    .where(
      and(
        eq(schema.professionalAvailability.professionalId, p.id),
        eq(schema.professionalAvailability.booked, false),
      ),
    )
    .orderBy(asc(schema.professionalAvailability.startsAt))
    .limit(20);

  const chats = await db
    .select()
    .from(schema.professionalQuickChats)
    .where(
      and(
        eq(schema.professionalQuickChats.professionalId, p.id),
        eq(schema.professionalQuickChats.userId, user.id),
      ),
    );

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">{p.fullName}</h1>
        <p className="text-sm text-plum-900/60">
          {p.city ?? "Online only"} ·{" "}
          {p.teleHealthEnabled ? "Tele-health enabled" : "In-person"}
        </p>
        {p.bio && (
          <p className="mt-3 text-sm text-plum-900/80">{p.bio}</p>
        )}
        <div className="mt-3 flex gap-1 flex-wrap">
          {p.specialties.map((s: string) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}
        </div>
      </header>

      <Card>
        <CardTitle>Quick chat</CardTitle>
        <CardSubtitle>
          Ask one question before committing to a full session.
        </CardSubtitle>
        <form action={quickChat} className="mt-3 space-y-2">
          <input type="hidden" name="professionalId" value={p.id} />
          <Textarea name="question" rows={3} required />
          <Button type="submit">Send</Button>
        </form>
        {chats.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {chats.map((c) => (
              <li key={c.id} className="rounded-2xl bg-plum-900/5 p-3">
                <p className="text-plum-900">Q: {c.question}</p>
                {c.reply && (
                  <p className="text-plum-900/70 mt-1">A: {c.reply}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Book a session</CardTitle>
        <CardSubtitle>
          Payment is confirmed manually — once you mark paid, the professional
          starts the session.
        </CardSubtitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((s) => (
            <form key={s.id} action={bookSession}>
              <input type="hidden" name="professionalId" value={p.id} />
              <input type="hidden" name="availabilityId" value={s.id} />
              <button
                type="submit"
                className="rounded-full bg-plum-900/5 px-3 py-1.5 text-sm text-plum-900 hover:bg-plum-900/10"
              >
                {new Date(s.startsAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </button>
            </form>
          ))}
          {slots.length === 0 && (
            <CardSubtitle>No slots open. Check back soon.</CardSubtitle>
          )}
        </div>
      </Card>
    </div>
  );
}
