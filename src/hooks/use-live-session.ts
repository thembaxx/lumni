"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { LiveSession } from "@/lib/study-groups/live-session-types";

export function useLiveSession(groupId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<{ session: LiveSession | null }>({
    queryKey: ["live-session", groupId],
    queryFn: async () => {
      if (!groupId) return { session: null };
      return apiFetch(`/api/study-groups/${groupId}/live-session`, {});
    },
    enabled: !!groupId,
    refetchInterval: false,
  });

  const startMutation = useMutation({
    mutationFn: async (subject?: string) => {
      return apiFetch<{ session: LiveSession }>(`/api/study-groups/${groupId}/live-session`, {
        method: "POST",
        body: JSON.stringify({ subject }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-session", groupId] });
    },
  });

  return {
    session: query.data?.session ?? null,
    isLoading: query.isLoading,
    startSession: (subject?: string) => startMutation.mutateAsync(subject),
    isStarting: startMutation.isPending,
  };
}
