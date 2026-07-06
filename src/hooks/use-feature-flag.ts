"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { isFlagEnabled, flagRegistry } from "@/lib/shared/flags";
import type { FlagOverride } from "@/lib/shared/flags/types";

interface FlagsResponse {
  overrides: FlagOverride[];
}

export function useFeatureFlag(
  flagKey: string,
  userId?: string,
): { enabled: boolean; isLoading: boolean } {
  const { data, isPending } = useQuery<FlagsResponse>({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/flags?adminKey=admin");
        if (!res.ok) return { overrides: [] };
        return res.json() as Promise<FlagsResponse>;
      } catch {
        return { overrides: [] };
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
    networkMode: "offlineFirst",
  });

  const enabled = useMemo(() => {
    return isFlagEnabled(
      flagKey,
      userId,
      data?.overrides,
      flagRegistry as unknown as Record<string, never>,
    );
  }, [flagKey, userId, data?.overrides]);

  return { enabled, isLoading: isPending };
}
