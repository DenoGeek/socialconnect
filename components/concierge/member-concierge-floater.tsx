"use client";

import { FloatingConciergeChat } from "./floating-concierge-chat";
import type { ConciergeChatMessage } from "./floating-concierge-chat";

type Props = {
  threadId: string;
  userId: string;
  initialMessages: ConciergeChatMessage[];
  conciergeOnDuty: boolean;
  matchmakerName: string;
};

export function MemberConciergeFloater({
  threadId,
  userId,
  initialMessages,
  conciergeOnDuty,
  matchmakerName,
}: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FloatingConciergeChat
        threadId={threadId}
        viewerUserId={userId}
        memberUserId={userId}
        initialMessages={initialMessages}
        conciergeOnDuty={conciergeOnDuty}
        headerName={matchmakerName}
        headerRole={
          conciergeOnDuty
            ? "Matchmaker · On duty"
            : "Matchmaker · Replies within 24h"
        }
      />
    </div>
  );
}
