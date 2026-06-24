"use client";

import * as Ably from "ably";
import { ChatClient, LogLevel } from "@ably/chat";
import { useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export function useAblyChat(): ChatClient | null {
  const { user, authReady } = useAuth();
  const clientRef = useRef<ChatClient | null>(null);
  const userIdRef = useRef<string | null>(null);

  const chatClient = useMemo(() => {
    const userId = user?.$id ?? null;

    if (!authReady || !userId) {
      if (clientRef.current) {
        clientRef.current = null;
        userIdRef.current = null;
      }
      return null;
    }

    if (clientRef.current && userIdRef.current === userId) {
      return clientRef.current;
    }

    if (clientRef.current) {
      clientRef.current = null;
    }

    const realtime = new Ably.Realtime({
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
            err instanceof Ably.ErrorInfo
              ? err
              : new Ably.ErrorInfo("Ably auth failed", 40000, 401),
            null,
          );
        }
      },
    });

    const chat = new ChatClient(realtime, { logLevel: LogLevel.Error });
    clientRef.current = chat;
    userIdRef.current = userId;
    return chat;
  }, [user?.$id, authReady]);

  return chatClient;
}
