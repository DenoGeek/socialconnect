import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const user = await requireUser();
  const [e] = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.id, enrollmentId))
    .limit(1);
  if (!e || (e.primaryUserId !== user.id && e.partnerUserId !== user.id))
    notFound();
  if (e.status !== "graduated") notFound();

  const [cohort] = await db
    .select()
    .from(schema.cohorts)
    .where(eq(schema.cohorts.id, e.cohortId))
    .limit(1);
  const [program] = await db
    .select()
    .from(schema.programs)
    .where(eq(schema.programs.id, cohort.programId))
    .limit(1);
  const [primary] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, e.primaryUserId))
    .limit(1);
  let partner = null;
  if (e.partnerUserId) {
    [partner] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, e.partnerUserId))
      .limit(1);
  }

  return (
    <div className="bg-plum-50 min-h-screen flex items-center justify-center p-8">
      <div
        className="aspect-[4/3] w-full max-w-3xl rounded-3xl p-12 text-plum-100"
        style={{
          background:
            "linear-gradient(140deg, #380b38 0%, #4c1148 70%, #f6b754 220%)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.6em] opacity-70">
          Evermore · Agano
        </p>
        <h1 className="text-display text-5xl mt-6">Legacy Certificate</h1>
        <p className="mt-12 opacity-80">This certifies that</p>
        <p className="text-display text-3xl mt-2">
          {primary.name}
          {partner ? ` & ${partner.name}` : ""}
        </p>
        <p className="mt-4 opacity-80">
          have completed the <strong>{program.title}</strong> program with the
          Evermore Hearth.
        </p>
        <p className="mt-12 text-xs uppercase tracking-widest opacity-60">
          Issued {new Date(e.graduatedAt ?? new Date()).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
