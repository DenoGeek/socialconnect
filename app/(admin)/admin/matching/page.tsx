import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { rankCandidatesForUser } from "@/lib/matching/engine";

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; mode?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  // Eligible candidates: not the same user, not banned.
  const allUsers = await db
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(
      schema.profiles,
      eq(schema.profiles.userId, schema.users.id),
    );

  let ranking: { candidateId: string; score: number; sharedIntents: string[] }[] =
    [];
  if (sp.userId) {
    const candidates = allUsers
      .filter((u) => u.user.id !== sp.userId && !u.user.banned)
      .map((u) => u.user.id);
    ranking = await rankCandidatesForUser(sp.userId, candidates);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">Matching engine</h1>
        <p className="text-sm text-plum-900/60">
          Intent badges weigh higher than interests. Shadow matching for Elite
          users never notifies the candidates.
        </p>
      </header>

      <Card>
        <form className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-plum-900/50 mb-1">
              Run for user
            </label>
            <select
              name="userId"
              defaultValue={sp.userId ?? ""}
              className="w-full rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {allUsers.map((u) => (
                <option key={u.user.id} value={u.user.id}>
                  {u.user.name} · {u.user.email} {u.user.tier === "elite" ? "🪙" : ""}
                </option>
              ))}
            </select>
          </div>
          <select
            name="mode"
            defaultValue={sp.mode ?? "normal"}
            className="rounded-2xl border border-plum-900/15 bg-white px-3 py-2 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="shadow">Shadow (silent)</option>
          </select>
          <Button type="submit">Rank</Button>
        </form>
      </Card>

      {ranking.length > 0 && (
        <Card>
          <CardTitle>Top candidates</CardTitle>
          <CardSubtitle>
            {sp.mode === "shadow"
              ? "Silent — no notification will be sent."
              : "Open the user to send a match."}
          </CardSubtitle>
          <table className="w-full text-sm mt-4">
            <thead className="text-xs uppercase tracking-widest text-plum-900/50 text-left">
              <tr>
                <th className="py-2">Candidate</th>
                <th>Score</th>
                <th>Shared intents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum-900/8">
              {ranking.slice(0, 15).map((r) => {
                const u = allUsers.find((x) => x.user.id === r.candidateId);
                return (
                  <tr key={r.candidateId}>
                    <td className="py-2">
                      {u?.user.name} <span className="text-xs text-plum-900/50">{u?.user.email}</span>
                    </td>
                    <td className="text-plum-900 font-medium">{r.score}</td>
                    <td className="text-xs text-plum-900/70">
                      {r.sharedIntents.join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
