"use client";

import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import UserMultipleIcon from "@hugeicons/core-free-icons/UserMultipleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChatRoomProvider, usePresence, usePresenceListener } from "@ably/chat/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/shared/logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import type { LiveSession } from "@/lib/study-groups/live-session-types";
import { apiFetch } from "@/lib/shared/api-fetch";
import { cn } from "@/lib/utils";
import { useLiveSession } from "@/hooks/use-live-session";

const ACTIVITIES = [
  { value: "Studying", label: "Studying" },
  { value: "Reviewing", label: "Reviewing" },
  { value: "Taking Quiz", label: "Taking Quiz" },
  { value: "Done", label: "Done" },
];

interface LiveParticipant {
  userId: string;
  userName: string;
  currentActivity?: string;
}

function ParticipantAvatar({ participant }: { participant: LiveParticipant }) {
  const initial = (participant.userName ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex items-center gap-1.5" title={participant.userName ?? "Anonymous"}>
      <Avatar className="size-7 border-2 border-green-400/50">
        <AvatarFallback className="bg-green-500/10 text-(--fs-caption-3) text-green-600">
          {initial}
        </AvatarFallback>
      </Avatar>
      {participant.currentActivity && (
        <span className="max-w-24 truncate text-(--fs-caption-3) text-foreground/50">
          {participant.currentActivity}
        </span>
      )}
    </div>
  );
}

function ParticipantAvatars({ participants }: { participants: LiveParticipant[] }) {
  const visible = participants.slice(0, 5);
  const remainder = participants.length - visible.length;
  return (
    <div className="flex items-center gap-1">
      {visible.map((p) => (
        <ParticipantAvatar key={p.userId} participant={p} />
      ))}
      {remainder > 0 && <span className="ml-1 text-muted-foreground/50 text-xs">+{remainder}</span>}
    </div>
  );
}

function LiveSessionContent({ session, groupId }: { session: LiveSession; groupId: string }) {
  const { user } = useAuth();
  const userId = user?.$id;

  const { enter, leave, update } = usePresence({
    autoEnterLeave: false,
  });

  const { presenceData } = usePresenceListener();

  const participants: LiveParticipant[] = useMemo(
    () =>
      presenceData.map((m) => ({
        userId: m.clientId,
        userName:
          ((m.data as Record<string, string> | undefined)?.["userName"] as string) ?? "Anonymous",
        currentActivity: (m.data as Record<string, string> | undefined)?.["currentActivity"] as
          | string
          | undefined,
      })),
    [presenceData],
  );

  const presenceDataRef = useRef(presenceData);
  presenceDataRef.current = presenceData;

  const currentParticipant = participants.find((p) => p.userId === userId);
  const isParticipant = !!currentParticipant;

  const handleJoin = useCallback(() => {
    enter({
      userId: userId ?? "",
      userName: user?.name ?? "Anonymous",
      currentActivity: "Studying",
    } as Record<string, string>);
  }, [enter, userId, user?.name]);

  const handleLeave = useCallback(() => {
    leave();
  }, [leave]);

  const handleActivityChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      update({
        userId: userId ?? "",
        userName: user?.name ?? "Anonymous",
        currentActivity: value,
      } as Record<string, string>);
    },
    [update, userId, user?.name],
  );

  useEffect(() => {
    return () => {
      const currentMembers = presenceDataRef.current;
      const isLast =
        currentMembers.length === 0 ||
        (currentMembers.length === 1 && currentMembers[0]?.clientId === userId);
      if (isLast) {
        endSessionOnServer(session.$id, groupId).catch((err) =>
          logError("LiveSessionBar.endSession", err),
        );
      }
      leave();
    };
  }, [leave, session.$id, groupId, userId]);

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-[border-color,background-color]",
        "border-green-400/30 bg-green-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <HugeiconsIcon icon={UserGroupIcon} className="size-5 text-green-500" data-icon />
            <span className="absolute -end-0.5 -top-0.5 block size-2 rounded-full bg-green-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-500" />
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Live Session</p>
            <p className="text-muted-foreground/60 text-xs">
              {participants.length} {participants.length === 1 ? "participant" : "participants"}
            </p>
          </div>
          {participants.length > 0 && <ParticipantAvatars participants={participants} />}
        </div>

        <div className="flex items-center gap-2">
          {session.startedBy !== userId && (
            <span className="text-muted-foreground/50 text-xs">
              Started by {session.startedByName ?? "someone"}
            </span>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {isParticipant ? (
              <m.div
                key="participant"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Select
                  value={currentParticipant?.currentActivity ?? "Studying"}
                  onValueChange={handleActivityChange}
                >
                  <SelectTrigger className="h-8 w-32 rounded-lg px-2 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITIES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  className="h-8 gap-1.5 rounded-lg text-xs"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-3.5" data-icon />
                  Leave
                </Button>
              </m.div>
            ) : (
              <m.div
                key="join"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleJoin}
                  className="h-8 gap-1.5 rounded-lg text-xs"
                >
                  <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" data-icon />
                  Join Session
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface LiveSessionBarProps {
  groupId: string;
}

export function LiveSessionBar({ groupId }: LiveSessionBarProps) {
  const { isLoading, session, startSession, isStarting } = useLiveSession(groupId);

  const isActive = session?.status === "active";

  const handleStart = useCallback(() => {
    startSession();
  }, [startSession]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <Skeleton className="h-6 w-40 bg-muted/30" />
      </div>
    );
  }

  if (isActive && session) {
    return (
      <ChatRoomProvider name={`chat-sessions:${session.$id}`}>
        <LiveSessionContent session={session} groupId={groupId} />
      </ChatRoomProvider>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            icon={UserMultipleIcon}
            className="size-5 text-muted-foreground/50"
            data-icon
          />
          <div>
            <p className="font-medium text-foreground text-sm">Study Session</p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleStart}
          disabled={isStarting}
          className="h-8 gap-1.5 rounded-lg text-xs"
        >
          <HugeiconsIcon icon={PlayIcon} className="size-3.5" data-icon />
          Start Live
        </Button>
      </div>
    </div>
  );
}

async function endSessionOnServer(sessionId: string, groupId?: string): Promise<void> {
  if (!groupId) return;
  try {
    await apiFetch(`/api/study-groups/${groupId}/live-session/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "end" }),
    });
  } catch {
    // Auto-end is best-effort
  }
}
