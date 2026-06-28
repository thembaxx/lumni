"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import type { LeaderboardEntry } from "@/lib/services/leaderboard-service";

export function useLeaderboard(userId?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function fetchEntries() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = (await res.json()) as { entries: LeaderboardEntry[] };
        if (cancelled) return;
        const marked = (data.entries ?? []).map((e) => ({
          ...e,
          isCurrentUser: e.isCurrentUser || e.userId === userId,
        }));
        setEntries(marked);
        setIsLoading(false);
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchEntries();

    if (typeof window !== "undefined") {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.USER_GAMIFICATION}.documents`;
      try {
        unsub = client.subscribe(channel, () => {
          fetchEntries();
        });
      } catch {
        // Realtime unavailable — rely on initial fetch
      }
    }

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [userId]);

  return { entries, isLoading };
}
