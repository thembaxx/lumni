"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { routePrefetchMap } from "@/lib/navigation/prefetch-registry";
import { useAuth } from "@/lib/auth/auth-context";

export function useDataPrefetch() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const prefetch = useCallback(
    (route: string) => {
      const normalized = route.replace(/\/+$/, "") || "/";
      const prefetcher = routePrefetchMap[normalized];
      if (prefetcher) {
        prefetcher(qc, { userId: user?.$id });
      }
    },
    [qc, user?.$id],
  );

  return prefetch;
}
