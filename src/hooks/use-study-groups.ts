"use client";

import type {
	GroupMember,
	GroupPost,
	StudyGroup,
} from "@/lib/study-groups/types";
import {
	createApiQuery,
	createInvalidatingMutation,
} from "./use-hook-factories";

interface GroupsResponse {
	groups: StudyGroup[];
}

interface GroupDetailResponse {
	group: StudyGroup;
	members: GroupMember[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const useStudyGroups = createApiQuery<StudyGroup[], void>({
	queryKey: ["study-groups"],
	fetchFn: async () => {
		const res = await fetch("/api/study-groups");
		if (!res.ok) throw new Error("Failed to fetch study groups");
		const data = (await res.json()) as GroupsResponse;
		return data.groups;
	},
});

export const useGroupDetail = createApiQuery<
	GroupDetailResponse | null,
	string | undefined
>({
	queryKey: (groupId) => ["study-group", groupId],
	fetchFn: async (groupId) => {
		if (!groupId) return null;
		const res = await fetch(`/api/study-groups/${groupId}`);
		if (!res.ok) throw new Error("Failed to fetch group detail");
		return res.json() as Promise<GroupDetailResponse>;
	},
	enabled: (groupId) => !!groupId,
});

export const useGroupPosts = createApiQuery<GroupPost[], string | undefined>({
	queryKey: (groupId) => ["group-posts", groupId],
	fetchFn: async (groupId) => {
		if (!groupId) return [];
		const res = await fetch(`/api/study-groups/${groupId}/posts`);
		if (!res.ok) throw new Error("Failed to fetch group posts");
		const data = (await res.json()) as { posts: GroupPost[] };
		return data.posts;
	},
	enabled: (groupId) => !!groupId,
});

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateGroupInput {
	name: string;
	description?: string;
	subjectId?: string;
}

export const useCreateGroup = createInvalidatingMutation<
	CreateGroupInput,
	{ group: StudyGroup },
	StudyGroup
>({
	endpoint: "/api/study-groups",
	invalidateKey: ["study-groups"],
	transformResponse: (res) => res.group,
});

export const useJoinGroup = createInvalidatingMutation<
	string,
	{ group: StudyGroup },
	StudyGroup
>({
	endpoint: "/api/study-groups/join",
	invalidateKey: ["study-groups"],
	bodySerializer: (inviteCode) => ({ inviteCode }),
	transformResponse: (res) => res.group,
});

export const useLeaveGroup = createInvalidatingMutation<
	string,
	{ success: boolean },
	void
>({
	endpoint: (groupId) => `/api/study-groups/${groupId}/leave`,
	invalidateKey: ["study-groups"],
	transformResponse: () => undefined,
});

interface CreatePostInput {
	groupId: string;
	content: string;
	questionText?: string;
	subject?: string;
	topic?: string;
}

export const useCreatePost = createInvalidatingMutation<
	CreatePostInput,
	{ post: GroupPost },
	GroupPost
>({
	endpoint: (input) => `/api/study-groups/${input.groupId}/posts`,
	invalidateKey: (input) => ["group-posts", input.groupId],
	transformResponse: (res) => res.post,
});

export const useDeletePost = createInvalidatingMutation<
	string,
	{ success: boolean },
	void
>({
	endpoint: (postId) => `/api/study-groups/posts/${postId}`,
	method: "DELETE",
	invalidateKey: ["group-posts"],
	transformResponse: () => undefined,
});

interface RemoveMemberInput {
	groupId: string;
	memberId: string;
}

export const useRemoveMember = createInvalidatingMutation<
	RemoveMemberInput,
	{ success: boolean },
	void
>({
	endpoint: (input) =>
		`/api/study-groups/${input.groupId}/members/${input.memberId}`,
	method: "DELETE",
	invalidateKey: (input) => ["study-group", input.groupId],
	transformResponse: () => undefined,
});

export const useDeleteGroup = createInvalidatingMutation<
	string,
	{ success: boolean },
	void
>({
	endpoint: (groupId) => `/api/study-groups/${groupId}`,
	method: "DELETE",
	invalidateKey: ["study-groups"],
	transformResponse: () => undefined,
});
