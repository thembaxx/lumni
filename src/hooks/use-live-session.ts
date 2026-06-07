"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";
import type {
	LiveSession,
	LiveSessionParticipant,
} from "@/lib/study-groups/live-session-types";

interface SessionResponse {
	session: LiveSession | null;
	participants: LiveSessionParticipant[];
}

export function useLiveSession(groupId: string | undefined) {
	return useQuery<SessionResponse>({
		queryKey: ["live-session", groupId],
		queryFn: async () => {
			if (!groupId) return { session: null, participants: [] };
			return apiFetch<SessionResponse>(
				`/api/study-groups/${groupId}/live-session`,
				{},
			);
		},
		enabled: !!groupId,
		refetchInterval: 15_000,
	});
}

export function useStartSession(groupId: string) {
	const queryClient = useQueryClient();

	return useMutation<{ session: LiveSession }, Error, { subject?: string }>({
		mutationFn: async ({ subject }) => {
			return apiFetch<{ session: LiveSession }>(
				`/api/study-groups/${groupId}/live-session`,
				{
					method: "POST",
					body: JSON.stringify({ subject }),
				},
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["live-session", groupId] });
		},
	});
}

export function useEndSession(groupId: string) {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: async (sessionId) => {
			await apiFetch<void>(
				`/api/study-groups/${groupId}/live-session/${sessionId}`,
				{
					method: "PATCH",
				},
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["live-session", groupId] });
		},
	});
}
