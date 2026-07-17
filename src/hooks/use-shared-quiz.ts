"use client";

import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export interface SharedQuizParticipant {
  userId: string;
  userName: string;
  score: number;
  progress: number;
}

export interface QuizAnswerEvent {
  clientId: string;
  questionId: string;
  correct: boolean;
}

export interface UseSharedQuizReturn {
  participants: SharedQuizParticipant[];
  isConnected: boolean;
  currentUserProgress: number;
  submitAnswer: (questionId: string, correct: boolean) => void;
  setProgress: (progress: number) => void;
  completeQuiz: () => void;
}

function createRealtimeClient(): Ably.Realtime {
  return new Ably.Realtime({
    authCallback: async (_tokenParams, callback) => {
      try {
        const res = await fetch("/api/ably/token");
        if (!res.ok) {
          callback(new Ably.ErrorInfo("Failed to fetch Ably token", 40000, 401), null);
          return;
        }
        const tokenRequest = await res.json();
        callback(null, tokenRequest);
      } catch (err) {
        callback(
          err instanceof Ably.ErrorInfo ? err : new Ably.ErrorInfo("Ably auth failed", 40000, 401),
          null,
        );
      }
    },
  });
}

function extractParticipants(members: Ably.PresenceMessage[]): SharedQuizParticipant[] {
  return members
    .filter((m) => m.data && typeof m.data === "object")
    .map((m) => {
      const d = m.data as Record<string, unknown>;
      return {
        userId: (d.userId as string) ?? "",
        userName: (d.userName as string) ?? "Anonymous",
        score: (d.score as number) ?? 0,
        progress: (d.progress as number) ?? 0,
      };
    });
}

export function useSharedQuiz(channelName: string | null): UseSharedQuizReturn {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<SharedQuizParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserProgress, setCurrentUserProgress] = useState(0);
  const realtimeRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const currentScoreRef = useRef(0);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!channelName || !user?.$id) return;

    userIdRef.current = user.$id;

    const realtime = createRealtimeClient();
    realtimeRef.current = realtime;

    const channel = realtime.channels.get(`shared-quiz:${channelName}`);
    channelRef.current = channel;

    channel.presence.enter({
      userId: user.$id,
      userName: user.name ?? "Anonymous",
      score: 0,
      progress: 0,
    });

    const updateParticipants = () => {
      channel.presence.get(null, (err, members) => {
        if (err || !members) return;
        setParticipants(extractParticipants(members));
      });
    };

    channel.presence.subscribe("enter", updateParticipants);
    channel.presence.subscribe("leave", updateParticipants);
    channel.presence.subscribe("update", updateParticipants);

    channel.presence.get(null, (_err, members) => {
      if (!members) return;
      setParticipants(extractParticipants(members));
    });

    setIsConnected(true);

    return () => {
      channel.presence.unsubscribe("enter", updateParticipants);
      channel.presence.unsubscribe("leave", updateParticipants);
      channel.presence.unsubscribe("update", updateParticipants);
      channel.presence.leave();
      channel.detach();
      realtime.close();
      realtimeRef.current = null;
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [channelName, user?.$id, user?.name]);

  const submitAnswer = useCallback(
    (questionId: string, correct: boolean) => {
      const channel = channelRef.current;
      if (!channel || !userIdRef.current) return;

      currentScoreRef.current += correct ? 1 : 0;
      channel.presence.update({
        userId: userIdRef.current,
        userName: user?.name ?? "Anonymous",
        score: currentScoreRef.current,
        progress: currentUserProgress,
      });

      channel.publish("answer-submitted", {
        clientId: userIdRef.current,
        questionId,
        correct,
      });
    },
    [user?.name, currentUserProgress],
  );

  const setProgress = useCallback(
    (progress: number) => {
      setCurrentUserProgress(progress);
      const channel = channelRef.current;
      if (!channel || !userIdRef.current) return;

      channel.presence.update({
        userId: userIdRef.current,
        userName: user?.name ?? "Anonymous",
        score: currentScoreRef.current,
        progress,
      });
    },
    [user?.name],
  );

  const completeQuiz = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !userIdRef.current) return;

    channel.publish("quiz-completed", {
      clientId: userIdRef.current,
      score: currentScoreRef.current,
    });
  }, []);

  return {
    participants,
    isConnected,
    currentUserProgress,
    submitAnswer,
    setProgress,
    completeQuiz,
  };
}
