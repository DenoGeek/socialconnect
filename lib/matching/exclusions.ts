import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";

export async function isPairExcluded(userAId: string, userBId: string) {
  const [row] = await db
    .select({ id: schema.matchExclusions.id })
    .from(schema.matchExclusions)
    .where(
      or(
        and(
          eq(schema.matchExclusions.userAId, userAId),
          eq(schema.matchExclusions.userBId, userBId),
        ),
        and(
          eq(schema.matchExclusions.userAId, userBId),
          eq(schema.matchExclusions.userBId, userAId),
        ),
      ),
    )
    .limit(1);
  return Boolean(row);
}
