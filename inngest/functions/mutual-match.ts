import { inngest } from "../client";
import { suggestBridgeUpsell, retargetIfStale } from "@/lib/matching/bridge-upsell";

export const onMatchCreated = inngest.createFunction(
  {
    id: "on-match-created",
    triggers: [{ event: "match.created" }],
  },
  async ({ event }) => {
    const data = (event as unknown as { data: { matchId: string } }).data;
    await suggestBridgeUpsell(data.matchId);
  },
);

export const retargetStaleUpsells = inngest.createFunction(
  {
    id: "retarget-stale-upsells",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async () => {
    await retargetIfStale();
  },
);
