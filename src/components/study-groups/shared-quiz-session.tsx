"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { useSharedQuiz } from "@/hooks/use-shared-quiz";
import { useAblyChat } from "@/hooks/use-ably-chat";
import { SharedWhiteboard } from "@/components/collaborative/shared-whiteboard";
import { VoiceService, type VoiceState } from "@/lib/collaborative/voice-service";
import type { SharedQuizParticipant } from "@/hooks/use-shared-quiz";

interface SharedQuizSessionProps {
  channelName: string;
  totalQuestions: number;
  sessionId: string;
  className?: string;
}

type Tab = "progress" | "whiteboard" | "voice";

function ParticipantRow({
  participant,
  isCurrentUser,
  totalQuestions,
}: {
  participant: SharedQuizParticipant;
  isCurrentUser: boolean;
  totalQuestions: number;
}) {
  const progressPercent =
    totalQuestions > 0 ? Math.round((participant.progress / totalQuestions) * 100) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isCurrentUser && "border-(--system-accent)/40 bg-(--system-accent)/5",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-sm",
          isCurrentUser
            ? "bg-(--system-accent)/10 text-(--system-accent)"
            : "bg-muted text-muted-foreground",
        )}
      >
        {(participant.userName ?? "?")[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="truncate font-medium text-sm">
            {participant.userName}
            {isCurrentUser && (
              <span className="ml-1.5 text-(--fs-caption-3) text-muted-foreground">(you)</span>
            )}
          </span>
          <span className="font-bold text-sm tabular-nums">{participant.score}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--system-accent) transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
            {participant.progress}/{totalQuestions}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SharedQuizSession({
  channelName,
  totalQuestions,
  sessionId,
  className,
}: SharedQuizSessionProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const ablyChat = useAblyChat();
  const { participants, isConnected } = useSharedQuiz(channelName);
  const [activeTab, setActiveTab] = useState<Tab>("progress");
  const [voiceStates, setVoiceStates] = useState<VoiceState[]>([]);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const voiceChannelRef = useRef<{
    unsubscribe: (event: string, handler: (msg: unknown) => void) => void;
    subscribe: (event: string, handler: (msg: unknown) => void) => void;
  } | null>(null);
  const signalHandlerRef = useRef<((msg: unknown) => void) | null>(null);

  const userId = user?.$id ?? "";
  const userName = user?.name ?? "";

  useEffect(() => {
    return () => {
      voiceServiceRef.current?.destroy();
      voiceServiceRef.current = null;
    };
  }, []);

  const handleJoinVoice = useCallback(async () => {
    if (!userId || !userName) return;

    const realtime = ablyChat?.realtime;
    const publishSignal = (targetUserId: string, signal: unknown) => {
      const channel = realtime?.channels.get(`voice:${sessionId}`);
      if (channel) {
        channel.publish("signal", { from: userId, target: targetUserId, signal });
      }
    };

    const service = new VoiceService({
      roomName: `voice:${sessionId}`,
      userId,
      userName,
      maxPeers: 4,
      publishSignal,
    });

    voiceServiceRef.current = service;

    service.onStateChange((states) => setVoiceStates(states));

    try {
      await service.connect(sessionId);
      setVoiceConnected(true);
      setVoiceError(null);

      const channel = realtime?.channels.get(`voice:${sessionId}`) ?? null;
      voiceChannelRef.current = channel;
      if (channel) {
        const handler = (msg: unknown) => {
          const data = msg as
            | { data?: { from?: string; target?: string; signal?: unknown } }
            | undefined;
          if (data?.data?.target === userId) {
            service.handleSignal(data.data.from ?? "", data.data.signal);
          }
        };
        signalHandlerRef.current = handler;
        channel.subscribe("signal", handler);
      }
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Failed to join voice");
      voiceServiceRef.current = null;
    }
  }, [userId, userName, sessionId, ablyChat]);

  const handleLeaveVoice = useCallback(() => {
    const channel = voiceChannelRef.current;
    const handler = signalHandlerRef.current;
    if (channel && handler) {
      channel.unsubscribe("signal", handler);
    }
    voiceChannelRef.current = null;
    signalHandlerRef.current = null;
    voiceServiceRef.current?.destroy();
    voiceServiceRef.current = null;
    setVoiceConnected(false);
    setVoiceError(null);
    setIsMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    const service = voiceServiceRef.current;
    if (service) {
      const next = !isMuted;
      service.setMuted(next);
      setIsMuted(next);
    }
  }, [isMuted]);

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: "progress", label: t("common.progress") || "Progress" },
      { id: "whiteboard", label: "Whiteboard" },
      { id: "voice", label: "Voice" },
    ],
    [t],
  );

  const showWhiteboard = activeTab === "whiteboard" && !!userId && !!userName;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex border-b" role="tablist" aria-label="Session tools">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`session-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-(--system-accent) text-(--system-accent)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3">
        {activeTab === "progress" && (
          <div
            id="session-panel-progress"
            role="tabpanel"
            aria-labelledby="tab-progress"
            className="flex flex-col gap-3"
          >
            {!participants.length && !isConnected ? null : (
              <>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="size-4 text-muted-foreground"
                    data-icon
                  />
                  <span className="font-medium text-sm">
                    {t("common.participants", { count: participants.length })}
                  </span>
                  {isConnected && (
                    <span className="ml-auto flex items-center gap-1 text-(--fs-caption-3) text-success">
                      <span className="block size-1.5 rounded-full bg-success" />
                      Live
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {[...participants]
                    .toSorted((a, b) => b.score - a.score)
                    .map((p) => (
                      <ParticipantRow
                        key={p.userId}
                        participant={p}
                        isCurrentUser={p.userId === userId}
                        totalQuestions={totalQuestions}
                      />
                    ))}
                </div>

                {participants.length > 1 && (
                  <p className="text-(--fs-caption-2) text-center text-muted-foreground">
                    {[...participants].toSorted((a, b) => b.score - a.score)[0]?.userId === userId
                      ? "You're in the lead!"
                      : `You're ${
                          ([...participants].toSorted((a, b) => b.score - a.score)[1]?.score ?? 0) -
                            ([...participants].find((p) => p.userId === userId)?.score ?? 0) >
                          0
                            ? "behind by"
                            : "ahead by"
                        } ${Math.abs(
                          ([...participants].find((p) => p.userId === userId)?.score ?? 0) -
                            ([...participants].toSorted((a, b) => b.score - a.score)[0]?.score ??
                              0),
                        )} point${
                          Math.abs(
                            ([...participants].find((p) => p.userId === userId)?.score ?? 0) -
                              ([...participants].toSorted((a, b) => b.score - a.score)[0]?.score ??
                                0),
                          ) === 1
                            ? ""
                            : "s"
                        }`}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "whiteboard" && (
          <div id="session-panel-whiteboard" role="tabpanel" aria-labelledby="tab-whiteboard">
            {showWhiteboard ? (
              <SharedWhiteboard className="border rounded-lg overflow-hidden" />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sign in to use the whiteboard
              </p>
            )}
          </div>
        )}

        {activeTab === "voice" && (
          <div
            id="session-panel-voice"
            role="tabpanel"
            aria-labelledby="tab-voice"
            className="flex flex-col items-center gap-4 py-6"
          >
            {!userId ? (
              <p className="text-sm text-muted-foreground">Sign in to use voice chat</p>
            ) : voiceConnected ? (
              <>
                <div className="flex items-center gap-2 text-sm text-success">
                  <span className="block size-2 rounded-full bg-success animate-pulse" />
                  Connected
                </div>
                {voiceStates.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {voiceStates.map((vs) => (
                      <div
                        key={vs.userId}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                          vs.userId === userId
                            ? "bg-(--system-accent)/10 text-(--system-accent)"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "block size-2 rounded-full",
                            vs.isSpeaking ? "bg-success" : "bg-muted-foreground/40",
                          )}
                        />
                        {vs.userName}
                        {vs.isMuted && <span className="text-xs opacity-60">(muted)</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      isMuted
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-(--system-accent)/10 text-(--system-accent) hover:bg-(--system-accent)/20",
                    )}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveVoice}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    aria-label="Leave voice chat"
                  >
                    Leave
                  </button>
                </div>
              </>
            ) : (
              <>
                {voiceError && (
                  <p className="text-sm text-destructive text-center max-w-xs">{voiceError}</p>
                )}
                <button
                  type="button"
                  onClick={handleJoinVoice}
                  className="px-6 py-2 rounded-full text-sm font-medium bg-(--system-accent) text-(--system-accent-foreground) hover:opacity-90 transition-opacity"
                  aria-label="Join voice chat"
                >
                  Join Voice
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
