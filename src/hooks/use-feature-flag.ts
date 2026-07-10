"use client";

import { createApiQuery } from "@/hooks/use-hook-factories";
import { useMemo } from "react";
import { isFlagEnabled, flagRegistry } from "@/lib/shared/flags";
import type { FlagOverride } from "@/lib/shared/flags/types";

interface FlagsResponse {
  overrides: FlagOverride[];
}

const useFlagsQuery = createApiQuery<FlagsResponse, void>({
  queryKey: ["admin-flags"],
  fetchFn: async () => {
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
  extraOptions: { networkMode: "offlineFirst" } as const,
});

export function useFeatureFlag(
  flagKey: string,
  userId?: string,
): { enabled: boolean; isLoading: boolean } {
  const { data, isPending } = useFlagsQuery(undefined);

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
