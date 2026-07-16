"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface CollaborativeSession {
  id: string;
  groupId: string;
  hostId: string;
  hostName: string;
  subject: string;
  topic?: string;
  status: "waiting" | "active" | "ended";
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  maxParticipants: number;
  currentParticipants: number;
  recordingEnabled: boolean;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: "host" | "co-host" | "participant";
  joinedAt: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  currentTool?: string;
  cursor?: { x: number; y: number };
}

export interface CreateSessionRequest {
  subject: string;
  topic?: string;
  groupId: string;
  settings?: {
    maxParticipants?: number;
    recordingEnabled?: boolean;
    voiceEnabled?: boolean;
    whiteboardEnabled?: boolean;
  };
  inviteCode?: string;
}

export interface JoinSessionResponse {
  session: CollaborativeSession;
  ablyToken: string;
  yjsDocId: string;
  webrtcConfig: {
    iceServers: RTCIceServer[];
    maxParticipants: number;
  };
}

function useAuthHeaders() {
  const { data: session } = useSession();
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

export function useCreateCollaborativeSession() {
  const queryClient = useQueryClient();
  const headers = useAuthHeaders();

  return useMutation<JoinSessionResponse, Error, CreateSessionRequest>({
    mutationFn: async (data) => {
      const res = await fetch("/api/collaborative/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create session" }));
        throw new Error(err.error || "Failed to create session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborative-sessions"] });
    },
  });
}

export function useCollaborativeSession(sessionId: string, enabled = true) {
  const headers = useAuthHeaders();

  return useQuery<JoinSessionResponse | null>({
    queryKey: ["collaborative-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/collaborative/sessions/${sessionId}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        const err = await res.json().catch(() => ({ error: "Failed to fetch session" }));
        throw new Error(err.error || "Failed to fetch session");
      }
      return res.json();
    },
    enabled: enabled && !!sessionId,
    staleTime: 30000,
  });
}

export function useCollaborativeSessionAction(sessionId: string) {
  const queryClient = useQueryClient();
  const headers = useAuthHeaders();

  return useMutation<
    { participant?: SessionParticipant; session?: CollaborativeSession },
    Error,
    { action: "start" | "end" | "join" | "leave" }
  >({
    mutationFn: async ({ action }) => {
      const res = await fetch(`/api/collaborative/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Action failed" }));
        throw new Error(err.error || "Action failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborative-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["collaborative-sessions"] });
    },
  });
}

export function useGroupCollaborativeSessions(groupId: string, enabled = true) {
  const headers = useAuthHeaders();

  return useQuery<CollaborativeSession[]>({
    queryKey: ["collaborative-sessions", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/collaborative/sessions?groupId=${groupId}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 60000,
  });
}
