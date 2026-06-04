import { logError } from "@/lib/shared/logger";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import type { ServiceResult } from "@/lib/services";
import { failure, success } from "@/lib/services";
import type {
	CreateGroupInput,
	CreatePostInput,
	GroupComment,
	GroupInvite,
	GroupMember,
	GroupPost,
	GroupReaction,
	GroupRole,
	StudyGroup,
} from "./types";

function generateInviteCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 8; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export async function createGroup(
	userId: string,
	input: CreateGroupInput,
): Promise<ServiceResult<StudyGroup>> {
	try {
		const inviteCode = generateInviteCode();
		const now = new Date().toISOString();

		const groupId = await createDocument(COLLECTIONS.STUDY_GROUPS, {
			name: input.name,
			description: input.description ?? "",
			subjectId: input.subjectId ?? "",
			inviteCode,
			createdBy: userId,
			memberCount: 1,
			createdAt: now,
		});

		await createDocument(COLLECTIONS.GROUP_MEMBERS, {
			groupId,
			userId,
			role: "admin",
			joinedAt: now,
		});

		const group = await getDocument<StudyGroup>(
			COLLECTIONS.STUDY_GROUPS,
			groupId,
		);
		if (!group) return failure("Failed to create group");
		return success(group);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to create group",
		);
	}
}

export async function getGroupsForUser(
	userId: string,
): Promise<ServiceResult<StudyGroup[]>> {
	try {
		const memberships = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`userId=${userId}`],
		);
		if (memberships.length === 0) return success([]);

		const groupPromises = memberships.map((m) =>
			getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, m.groupId),
		);
		const groups = (await Promise.all(groupPromises)).filter(
			Boolean,
		) as StudyGroup[];
		return success(groups);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to load groups",
		);
	}
}

export async function getGroupById(
	groupId: string,
): Promise<ServiceResult<StudyGroup>> {
	try {
		const group = await getDocument<StudyGroup>(
			COLLECTIONS.STUDY_GROUPS,
			groupId,
		);
		if (!group) return failure("Group not found");
		return success(group);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(err instanceof Error ? err.message : "Failed to load group");
	}
}

export async function getGroupMembers(
	groupId: string,
): Promise<ServiceResult<GroupMember[]>> {
	try {
		const members = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`groupId=${groupId}`],
		);
		return success(members);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to load members",
		);
	}
}

export async function joinGroup(
	userId: string,
	inviteCode: string,
): Promise<ServiceResult<StudyGroup>> {
	try {
		const groups = await listDocuments<StudyGroup>(COLLECTIONS.STUDY_GROUPS, [
			`inviteCode=${inviteCode}`,
		]);
		if (groups.length === 0) return failure("Invalid invite code");
		const group = groups[0];

		const existing = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`groupId=${group.$id}`, `userId=${userId}`],
		);
		if (existing.length > 0) return failure("Already a member of this group");

		await createDocument(COLLECTIONS.GROUP_MEMBERS, {
			groupId: group.$id,
			userId,
			role: "member" as GroupRole,
			joinedAt: new Date().toISOString(),
		});

		await updateDocument(COLLECTIONS.STUDY_GROUPS, group.$id, {
			memberCount: (group.memberCount ?? 0) + 1,
		});

		return success({ ...group, memberCount: (group.memberCount ?? 0) + 1 });
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(err instanceof Error ? err.message : "Failed to join group");
	}
}

export async function leaveGroup(
	userId: string,
	groupId: string,
): Promise<ServiceResult<void>> {
	try {
		const members = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`groupId=${groupId}`, `userId=${userId}`],
		);
		if (members.length === 0) return failure("Not a member of this group");

		await deleteDocument(COLLECTIONS.GROUP_MEMBERS, members[0].$id);

		const group = await getDocument<StudyGroup>(
			COLLECTIONS.STUDY_GROUPS,
			groupId,
		);
		if (group) {
			const newCount = Math.max(0, (group.memberCount ?? 1) - 1);
			await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, {
				memberCount: newCount,
			});
		}

		return success(undefined);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to leave group",
		);
	}
}

export async function createPost(
	userId: string,
	userName: string | undefined,
	input: CreatePostInput,
): Promise<ServiceResult<GroupPost>> {
	try {
		const now = new Date().toISOString();
		const postId = await createDocument(COLLECTIONS.GROUP_POSTS, {
			groupId: input.groupId,
			userId,
			userName: userName ?? "",
			content: input.content,
			questionText: input.questionText ?? "",
			subject: input.subject ?? "",
			topic: input.topic ?? "",
			createdAt: now,
		});
		const post = await getDocument<GroupPost>(COLLECTIONS.GROUP_POSTS, postId);
		if (!post) return failure("Failed to create post");
		return success(post);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to create post",
		);
	}
}

export async function getGroupPosts(
	groupId: string,
): Promise<ServiceResult<GroupPost[]>> {
	try {
		const posts = await listDocuments<GroupPost>(COLLECTIONS.GROUP_POSTS, [
			`groupId=${groupId}`,
			`orderDesc=createdAt`,
		]);
		return success(posts);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(err instanceof Error ? err.message : "Failed to load posts");
	}
}

export async function deletePost(
	userId: string,
	postId: string,
): Promise<ServiceResult<void>> {
	try {
		const post = await getDocument<GroupPost>(COLLECTIONS.GROUP_POSTS, postId);
		if (!post) return failure("Post not found");
		if (post.userId !== userId)
			return failure("Not authorized to delete this post");
		await deleteDocument(COLLECTIONS.GROUP_POSTS, postId);
		return success(undefined);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to delete post",
		);
	}
}

export async function getPostComments(
	postId: string,
): Promise<ServiceResult<GroupComment[]>> {
	try {
		const comments = await listDocuments<GroupComment>(
			COLLECTIONS.GROUP_COMMENTS,
			[`postId=${postId}`, `orderAsc=createdAt`],
		);
		return success(comments);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to load comments",
		);
	}
}

export async function createComment(
	userId: string,
	userName: string | undefined,
	postId: string,
	content: string,
	parentId?: string,
): Promise<ServiceResult<GroupComment>> {
	try {
		const now = new Date().toISOString();
		const commentId = await createDocument(COLLECTIONS.GROUP_COMMENTS, {
			postId,
			userId,
			userName: userName ?? "",
			content,
			parentId: parentId ?? "",
			createdAt: now,
			updatedAt: now,
		});
		const comment = await getDocument<GroupComment>(
			COLLECTIONS.GROUP_COMMENTS,
			commentId,
		);
		if (!comment) return failure("Failed to create comment");
		return success(comment);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to create comment",
		);
	}
}

export async function deleteComment(
	userId: string,
	commentId: string,
): Promise<ServiceResult<void>> {
	try {
		const comment = await getDocument<GroupComment>(
			COLLECTIONS.GROUP_COMMENTS,
			commentId,
		);
		if (!comment) return failure("Comment not found");
		if (comment.userId !== userId) return failure("Not authorized");
		await deleteDocument(COLLECTIONS.GROUP_COMMENTS, commentId);
		return success(undefined);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to delete comment",
		);
	}
}

export async function getPostReactions(
	postId: string,
): Promise<ServiceResult<GroupReaction[]>> {
	try {
		const reactions = await listDocuments<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			[`postId=${postId}`],
		);
		return success(reactions);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to load reactions",
		);
	}
}

export async function getCommentReactions(
	commentId: string,
): Promise<ServiceResult<GroupReaction[]>> {
	try {
		const reactions = await listDocuments<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			[`commentId=${commentId}`],
		);
		return success(reactions);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to load reactions",
		);
	}
}

export async function togglePostReaction(
	userId: string,
	postId: string,
	emoji: string,
): Promise<ServiceResult<GroupReaction | null>> {
	try {
		const existing = await listDocuments<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			[`postId=${postId}`, `userId=${userId}`, `emoji=${emoji}`],
		);
		if (existing.length > 0) {
			await deleteDocument(COLLECTIONS.GROUP_REACTIONS, existing[0].$id);
			return success(null);
		}
		const now = new Date().toISOString();
		const reactionId = await createDocument(COLLECTIONS.GROUP_REACTIONS, {
			postId,
			userId,
			emoji,
			createdAt: now,
		});
		const reaction = await getDocument<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			reactionId,
		);
		return success(reaction ?? null);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to toggle reaction",
		);
	}
}

export async function toggleCommentReaction(
	userId: string,
	commentId: string,
	emoji: string,
): Promise<ServiceResult<GroupReaction | null>> {
	try {
		const existing = await listDocuments<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			[`commentId=${commentId}`, `userId=${userId}`, `emoji=${emoji}`],
		);
		if (existing.length > 0) {
			await deleteDocument(COLLECTIONS.GROUP_REACTIONS, existing[0].$id);
			return success(null);
		}
		const now = new Date().toISOString();
		const reactionId = await createDocument(COLLECTIONS.GROUP_REACTIONS, {
			commentId,
			userId,
			emoji,
			createdAt: now,
		});
		const reaction = await getDocument<GroupReaction>(
			COLLECTIONS.GROUP_REACTIONS,
			reactionId,
		);
		return success(reaction ?? null);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to toggle reaction",
		);
	}
}

export async function removeMember(
	adminUserId: string,
	groupId: string,
	memberId: string,
): Promise<ServiceResult<void>> {
	try {
		const group = await getDocument<StudyGroup>(
			COLLECTIONS.STUDY_GROUPS,
			groupId,
		);
		if (!group) return failure("Group not found");
		if (group.createdBy !== adminUserId)
			return failure("Only the group creator can remove members");

		const member = await getDocument<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			memberId,
		);
		if (!member) return failure("Member not found");
		if (member.role === "admin")
			return failure("Cannot remove the group creator");

		await deleteDocument(COLLECTIONS.GROUP_MEMBERS, memberId);

		const newCount = Math.max(0, (group.memberCount ?? 1) - 1);
		await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, {
			memberCount: newCount,
		});

		return success(undefined);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to remove member",
		);
	}
}

export async function deleteGroup(
	userId: string,
	groupId: string,
): Promise<ServiceResult<void>> {
	try {
		const group = await getDocument<StudyGroup>(
			COLLECTIONS.STUDY_GROUPS,
			groupId,
		);
		if (!group) return failure("Group not found");
		if (group.createdBy !== userId)
			return failure("Only the creator can delete the group");

		const [members, invites] = await Promise.all([
			listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
				`groupId=${groupId}`,
			]),
			listDocuments<GroupInvite>(COLLECTIONS.GROUP_INVITES, [
				`groupId=${groupId}`,
			]),
		]);

		await Promise.all([
			...members.map((m) => deleteDocument(COLLECTIONS.GROUP_MEMBERS, m.$id)),
			...invites.map((i) => deleteDocument(COLLECTIONS.GROUP_INVITES, i.$id)),
			deleteDocument(COLLECTIONS.STUDY_GROUPS, groupId),
		]);
		return success(undefined);
	} catch (err) {
		logError("StudyGroupsService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to delete group",
		);
	}
}
