"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { GroupMember, StudyGroup } from "@/lib/study-groups/types";

interface GroupsResponse {
	groups: StudyGroup[];
}

interface GroupDetailResponse {
	group: StudyGroup;
	members: GroupMember[];
}

export function useStudyGroups() {
	return useQuery<StudyGroup[]>({
		queryKey: ["study-groups"],
		queryFn: async () => {
			const res = await apiFetch<GroupsResponse>("/api/study-groups", {});
			return res.groups;
		},
	});
}

export function useGroupDetail(groupId: string | undefined) {
	return useQuery<GroupDetailResponse | null>({
		queryKey: ["study-group", groupId],
		queryFn: async () => {
			if (!groupId) return null;
			return apiFetch<GroupDetailResponse>(`/api/study-groups/${groupId}`, {});
		},
		enabled: !!groupId,
	});
}

export function useCreateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			name: string;
			description?: string;
			subjectId?: string;
		}) => {
			const res = await apiFetch<{ group: StudyGroup }>("/api/study-groups", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return res.group;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["study-groups"] });
		},
	});
}

export function useJoinGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (inviteCode: string) => {
			const res = await apiFetch<{ group: StudyGroup }>(
				"/api/study-groups/join",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ inviteCode }),
				},
			);
			return res.group;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["study-groups"] });
		},
	});
}

export function useLeaveGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (groupId: string) => {
			await apiFetch<{ success: boolean }>(
				`/api/study-groups/${groupId}/leave`,
				{ method: "POST" },
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["study-groups"] });
		},
	});
}

export function useDeleteGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (groupId: string) => {
			await apiFetch<{ success: boolean }>(`/api/study-groups/${groupId}`, {
				method: "DELETE",
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["study-groups"] });
		},
	});
}
