"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { countPendingForMember, countPendingForStaff } from "@/lib/concierge/unread";
import { sendMessage } from "@/app/(app)/concierge/thread/actions";

export type ConciergeChatMessage = {
  id: string;
  senderUserId: string;
  body: string;
  priority: string;
  attachments: { name: string; ephemeral?: boolean }[];
  createdAt: string;
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 32 },
  },
};

const MATCHMAKER_AVATAR =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop";

type FloatingConciergeChatProps = {
  threadId: string;
  viewerUserId: string;
  memberUserId: string;
  initialMessages: ConciergeChatMessage[];
  conciergeOnDuty: boolean;
  staffView?: boolean;
  headerName: string;
  headerRole: string;
  headerAvatar?: string;
  /** Controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the launcher FAB when embedded in a multi-thread inbox */
  hideLauncher?: boolean;
  className?: string;
};

export function FloatingConciergeChat({
  threadId,
  viewerUserId,
  memberUserId,
  initialMessages,
  conciergeOnDuty,
  staffView = false,
  headerName,
  headerRole,
  headerAvatar,
  open: controlledOpen,
  onOpenChange,
  hideLauncher = false,
  className,
}: FloatingConciergeChatProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/concierge/${threadId}/messages`);
        if (res.ok) {
          const data = (await res.json()) as { messages: ConciergeChatMessage[] };
          setMessages(data.messages);
        }
      } catch {
        // ignore
      }
    }, 8000);
    return () => clearInterval(poll);
  }, [threadId]);

  const unread = staffView
    ? countPendingForStaff(messages, memberUserId)
    : countPendingForMember(messages, memberUserId);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const fd = new FormData();
    fd.set("threadId", threadId);
    fd.set("body", draft.trim());
    start(async () => {
      await sendMessage(fd);
      setDraft("");
      router.refresh();
    });
  }

  const avatarSrc = headerAvatar ?? (staffView ? undefined : MATCHMAKER_AVATAR);

  return (
    <div className={cn("flex flex-col items-end gap-3", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="concierge-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-plum-900/10 bg-white/95 shadow-2xl backdrop-blur-xl ring-1 ring-plum-900/5"
          >
            <div className="relative border-b border-plum-900/8 bg-gradient-to-br from-plum-50 to-plum-100/40 p-4">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={avatarSrc} alt={headerName} />
                      <AvatarFallback>
                        {headerName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                        conciergeOnDuty ? "bg-mint" : "bg-plum-200",
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-plum-900">
                      {headerName}
                    </h3>
                    <p className="text-xs text-plum-900/60">{headerRole}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-plum-900/60 hover:bg-plum-900/5 hover:text-plum-900"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex h-[320px] flex-col gap-3 overflow-y-auto bg-plum-50/80 p-4">
              {messages.length === 0 && (
                <motion.div variants={messageVariants} initial="hidden" animate="visible">
                  <div className="rounded-2xl border border-plum-900/8 bg-white px-4 py-3 text-sm text-plum-900/70 shadow-sm">
                    {staffView
                      ? "No messages yet — send the first reply."
                      : "Your matchmaker is ready when you are."}
                  </div>
                </motion.div>
              )}
              {messages.map((m) => {
                const mine = m.senderUserId === viewerUserId;
                return (
                  <motion.div
                    key={m.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn("flex gap-2.5", mine && "flex-row-reverse")}
                  >
                    <Avatar className="h-8 w-8 border border-plum-900/8 shadow-sm">
                      {!mine && (
                        <AvatarImage src={avatarSrc} alt={headerName} />
                      )}
                      <AvatarFallback
                        className={cn(
                          mine
                            ? "bg-plum-900 text-plum-100"
                            : "bg-plum-100 text-plum-900",
                        )}
                      >
                        {mine ? "You" : headerName.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex max-w-[80%] flex-col gap-1",
                        mine && "items-end",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          mine
                            ? "rounded-tr-sm bg-plum-900 text-plum-100"
                            : "rounded-tl-sm border border-plum-900/10 bg-white text-plum-900",
                        )}
                      >
                        <p className="whitespace-pre-line">{m.body}</p>
                      </div>
                      <span className="text-[10px] text-plum-900/45">
                        {new Date(m.createdAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-plum-900/8 bg-white/90 p-3 backdrop-blur-md">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    staffView ? "Reply to member…" : "Message your matchmaker…"
                  }
                  className="flex-1 rounded-full border border-plum-900/15 bg-plum-50/80 px-4 py-2.5 text-sm text-plum-900 outline-none placeholder:text-plum-900/40 focus:border-plum-500 focus:ring-2 focus:ring-plum-900/10"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={pending || !draft.trim()}
                  className="h-10 w-10 shrink-0 rounded-full p-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hideLauncher && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(!isOpen)}
          className={cn(
            "group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-2xl transition-colors",
            isOpen
              ? "bg-plum-700 text-plum-100"
              : "bg-plum-900 text-plum-100 hover:bg-plum-700",
          )}
          aria-label={isOpen ? "Close concierge chat" : "Open concierge chat"}
        >
          <span className="absolute inset-0 -z-10 rounded-full bg-plum-900/30 opacity-40 blur-xl transition-opacity group-hover:opacity-70" />
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
          {!isOpen && unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-plum-900 ring-2 ring-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

export function ConciergeChatBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-[10px] font-bold text-plum-900">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function ConciergeSparkIcon({ className }: { className?: string }) {
  return <Sparkles className={cn("h-4 w-4 text-amber", className)} />;
}
