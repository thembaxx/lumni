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
	GroupInvite,
	GroupMember,
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
		return failure(
			err instanceof Error ? err.message : "Failed to leave group",
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

		const members = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`groupId=${groupId}`],
		);
		await Promise.all(
			members.map((m) => deleteDocument(COLLECTIONS.GROUP_MEMBERS, m.$id)),
		);

		const invites = await listDocuments<GroupInvite>(
			COLLECTIONS.GROUP_INVITES,
			[`groupId=${groupId}`],
		);
		await Promise.all(
			invites.map((i) => deleteDocument(COLLECTIONS.GROUP_INVITES, i.$id)),
		);

		await deleteDocument(COLLECTIONS.STUDY_GROUPS, groupId);
		return success(undefined);
	} catch (err) {
		return failure(
			err instanceof Error ? err.message : "Failed to delete group",
		);
	}
}
