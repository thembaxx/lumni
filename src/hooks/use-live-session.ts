"use client";

import { createApiQuery, createInvalidatingMutation } from "@/hooks/use-hook-factories";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { LiveSession } from "@/lib/study-groups/live-session-types";

const useLiveSessionQuery = createApiQuery<{ session: LiveSession | null }, string | undefined>({
  queryKey: (id) => ["live-session", id],
  fetchFn: async (id) => {
    if (!id) return { session: null };
    return apiFetch(`/api/study-groups/${id}/live-session`, {});
  },
  enabled: (id) => !!id,
  staleTime: 1000 * 60 * 30,
});

interface StartSessionInput {
  groupId: string;
  subject?: string;
}

const useStartSessionMutation = createInvalidatingMutation<
  StartSessionInput,
  { session: LiveSession },
  { session: LiveSession }
>({
  endpoint: (input) => `/api/study-groups/${input.groupId}/live-session`,
  method: "POST",
  bodySerializer: (input) => ({ subject: input.subject }),
  invalidateKey: (input) => ["live-session", input.groupId],
});

export function useLiveSession(groupId: string | undefined) {
  const query = useLiveSessionQuery(groupId);
  const startMutation = useStartSessionMutation();

  return {
    session: query.data?.session ?? null,
    isLoading: query.isLoading,
    startSession: (subject?: string) => startMutation.mutateAsync({ groupId: groupId!, subject }),
    isStarting: startMutation.isPending,
  };
}
