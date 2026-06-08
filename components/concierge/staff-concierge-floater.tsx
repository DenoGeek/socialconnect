"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ConciergeChatBadge,
  FloatingConciergeChat,
  type ConciergeChatMessage,
} from "./floating-concierge-chat";

type InboxThread = {
  threadId: string;
  memberUserId: string;
  memberName: string;
  memberEmail: string;
  pathway: string | null;
  tier: string | null;
  conciergeOnDuty: boolean;
  unreadCount: number;
  lastMessageBody: string | null;
  messages: ConciergeChatMessage[];
};

export function StaffConciergeFloater({ staffUserId }: { staffUserId: string }) {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/concierge/inbox");
      if (res.ok) {
        const data = (await res.json()) as { threads: InboxThread[] };
        setThreads(data.threads);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadInbox();
    const id = setInterval(loadInbox, 8000);
    return () => clearInterval(id);
  }, [loadInbox]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const active = threads.find((t) => t.threadId === activeThreadId) ?? null;
  const showTray = hovering && !chatOpen;

  function openThread(threadId: string) {
    setActiveThreadId(threadId);
    setChatOpen(true);
    setHovering(false);
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {chatOpen && active && (
        <FloatingConciergeChat
          threadId={active.threadId}
          viewerUserId={staffUserId}
          memberUserId={active.memberUserId}
          initialMessages={active.messages}
          conciergeOnDuty={active.conciergeOnDuty}
          staffView
          headerName={active.memberName}
          headerRole={
            active.pathway === "zahari"
              ? "Zahari member"
              : active.tier === "elite"
                ? "Elite member"
                : "Member"
          }
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) setActiveThreadId(null);
          }}
          hideLauncher
        />
      )}

      <AnimatePresence>
        {showTray && threads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="flex flex-col items-end gap-2"
          >
            {threads.map((t) => (
              <button
                key={t.threadId}
                type="button"
                onClick={() => openThread(t.threadId)}
                className={cn(
                  "flex max-w-[260px] items-center gap-3 rounded-full border border-plum-900/10 bg-white/95 px-4 py-2.5 text-left shadow-lg backdrop-blur-md transition hover:border-plum-500/30 hover:shadow-xl",
                  t.unreadCount > 0 && "ring-1 ring-amber/40",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plum-100 text-xs font-semibold text-plum-900">
                  {t.memberName.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-plum-900">
                    {t.memberName}
                  </span>
                  <span className="block truncate text-[10px] text-plum-900/50">
                    {t.lastMessageBody ?? t.memberEmail}
                  </span>
                </span>
                <ConciergeChatBadge count={t.unreadCount} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (chatOpen) {
            setChatOpen(false);
            setActiveThreadId(null);
          } else if (threads.length === 1) {
            openThread(threads[0].threadId);
          } else {
            setHovering((h) => !h);
          }
        }}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-colors",
          chatOpen
            ? "bg-plum-700 text-plum-100"
            : "bg-plum-900 text-plum-100 hover:bg-plum-700",
        )}
        aria-label="Concierge inbox"
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-plum-900/30 opacity-40 blur-xl transition-opacity group-hover:opacity-70" />
        {chatOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        {!chatOpen && totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-plum-900 ring-2 ring-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
