import {
  COLLECTIONS,
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import type { ServiceResult } from "@/lib/shared/service-result";
import { failure, success } from "@/lib/shared/service-result";
import type {
  CreateGroupInput,
  GroupInvite,
  GroupMember,
  StudyGroup,
} from "../types";
import { generateInviteCode } from "./utils";

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

    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Failed to create group");
    return success(group);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to create group");
  }
}

export async function getGroupsForUser(userId: string): Promise<ServiceResult<StudyGroup[]>> {
  try {
    const memberships = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
      `userId=${userId}`,
    ]);
    if (memberships.length === 0) return success([]);

    const groupPromises = memberships.map((m) =>
      getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, m.groupId),
    );
    const groups = (await Promise.all(groupPromises)).filter(Boolean) as StudyGroup[];
    return success(groups);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load groups");
  }
}

export async function getGroupById(groupId: string): Promise<ServiceResult<StudyGroup>> {
  try {
    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");
    return success(group);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load group");
  }
}

export async function removeMember(
  adminUserId: string,
  groupId: string,
  memberId: string,
): Promise<ServiceResult<void>> {
  try {
    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");
    if (group.createdBy !== adminUserId)
      return failure("Only the group creator can remove members");

    const member = await getDocument<GroupMember>(COLLECTIONS.GROUP_MEMBERS, memberId);
    if (!member) return failure("Member not found");
    if (member.role === "admin") return failure("Cannot remove the group creator");

    await deleteDocument(COLLECTIONS.GROUP_MEMBERS, memberId);

    const newCount = Math.max(0, (group.memberCount ?? 1) - 1);
    await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, {
      memberCount: newCount,
    });

    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to remove member");
  }
}

export async function deleteGroup(userId: string, groupId: string): Promise<ServiceResult<void>> {
  try {
    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");
    if (group.createdBy !== userId) return failure("Only the creator can delete the group");

    const [members, invites] = await Promise.all([
      listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [`groupId=${groupId}`]),
      listDocuments<GroupInvite>(COLLECTIONS.GROUP_INVITES, [`groupId=${groupId}`]),
    ]);

    await Promise.all([
      ...members.map((m) => deleteDocument(COLLECTIONS.GROUP_MEMBERS, m.$id)),
      ...invites.map((i) => deleteDocument(COLLECTIONS.GROUP_INVITES, i.$id)),
      deleteDocument(COLLECTIONS.STUDY_GROUPS, groupId),
    ]);
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to delete group");
  }
}
