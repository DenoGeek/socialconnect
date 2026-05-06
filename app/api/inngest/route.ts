import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { assignAliasOnPurchase, postEventImpressions, detectMutualMatch } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [assignAliasOnPurchase, postEventImpressions, detectMutualMatch],
});
