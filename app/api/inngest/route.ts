import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  assignAliasOnPurchase,
  postEventImpressionsNudge,
  onMatchCreated,
  retargetStaleUpsells,
  installmentReminders,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    assignAliasOnPurchase,
    postEventImpressionsNudge,
    onMatchCreated,
    retargetStaleUpsells,
    installmentReminders,
  ],
});
