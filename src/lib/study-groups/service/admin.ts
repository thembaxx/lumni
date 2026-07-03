import { COLLECTIONS, getDocument, listDocuments, updateDocument } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import type { ServiceResult } from "@/lib/shared/service-result";
import { failure, success } from "@/lib/shared/service-result";
import type { GroupMember, GroupPost, StudyGroup } from "../types";

async function isAdminOrCoAdmin(userId: string, groupId: string): Promise<boolean> {
  const members = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
    `groupId=${groupId}`,
    `userId=${userId}`,
  ]);
  if (members.length === 0) return false;
  return members[0].role === "admin" || members[0].role === "co-admin";
}

async function isCreator(userId: string, groupId: string): Promise<boolean> {
  const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
  if (!group) return false;
  return group.createdBy === userId;
}

export async function updateGroup(
  userId: string,
  groupId: string,
  input: {
    name?: string;
    description?: string;
    subjectId?: string;
    visibility?: "public" | "private";
  },
): Promise<ServiceResult<StudyGroup>> {
  try {
    if (!(await isAdminOrCoAdmin(userId, groupId)))
      return failure("Only admins can update group settings");

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.subjectId !== undefined) updateData.subjectId = input.subjectId;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;

    await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, updateData);
    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");
    return success(group);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to update group");
  }
}

export async function pinPost(
  userId: string,
  groupId: string,
  postId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isAdminOrCoAdmin(userId, groupId))) return failure("Only admins can pin posts");

    const post = await getDocument<GroupPost>(COLLECTIONS.GROUP_POSTS, postId);
    if (!post) return failure("Post not found");

    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");

    const pinned = group.pinnedPostIds ?? [];
    if (!pinned.includes(postId)) {
      pinned.push(postId);
      await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, { pinnedPostIds: pinned });
    }

    await updateDocument(COLLECTIONS.GROUP_POSTS, postId, { isPinned: true });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to pin post");
  }
}

export async function unpinPost(
  userId: string,
  groupId: string,
  postId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isAdminOrCoAdmin(userId, groupId))) return failure("Only admins can unpin posts");

    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (!group) return failure("Group not found");

    const pinned = (group.pinnedPostIds ?? []).filter((id) => id !== postId);
    await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, { pinnedPostIds: pinned });
    await updateDocument(COLLECTIONS.GROUP_POSTS, postId, { isPinned: false });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to unpin post");
  }
}

export async function muteMember(
  adminUserId: string,
  groupId: string,
  memberId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isCreator(adminUserId, groupId)))
      return failure("Only the group creator can mute members");

    const member = await getDocument<GroupMember>(COLLECTIONS.GROUP_MEMBERS, memberId);
    if (!member) return failure("Member not found");
    if (member.role === "admin") return failure("Cannot mute the group creator");

    await updateDocument(COLLECTIONS.GROUP_MEMBERS, memberId, { isMuted: true });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to mute member");
  }
}

export async function unmuteMember(
  adminUserId: string,
  groupId: string,
  memberId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isCreator(adminUserId, groupId)))
      return failure("Only the group creator can unmute members");

    await updateDocument(COLLECTIONS.GROUP_MEMBERS, memberId, { isMuted: false });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to unmute member");
  }
}

export async function assignCoAdmin(
  creatorUserId: string,
  groupId: string,
  memberId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isCreator(creatorUserId, groupId)))
      return failure("Only the group creator can assign co-admins");

    const member = await getDocument<GroupMember>(COLLECTIONS.GROUP_MEMBERS, memberId);
    if (!member) return failure("Member not found");
    if (member.role === "admin" || member.role === "co-admin")
      return failure("Member is already an admin");

    await updateDocument(COLLECTIONS.GROUP_MEMBERS, memberId, { role: "co-admin" });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to assign co-admin");
  }
}

export async function removeCoAdmin(
  creatorUserId: string,
  groupId: string,
  memberId: string,
): Promise<ServiceResult<void>> {
  try {
    if (!(await isCreator(creatorUserId, groupId)))
      return failure("Only the group creator can remove co-admins");

    const member = await getDocument<GroupMember>(COLLECTIONS.GROUP_MEMBERS, memberId);
    if (!member) return failure("Member not found");
    if (member.role !== "co-admin") return failure("Member is not a co-admin");

    await updateDocument(COLLECTIONS.GROUP_MEMBERS, memberId, { role: "member" });
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to remove co-admin");
  }
}

export async function discoverGroups(
  subjectId?: string,
  search?: string,
): Promise<ServiceResult<StudyGroup[]>> {
  try {
    const filters = ["visibility=public"];
    if (subjectId) filters.push(`subjectId=${subjectId}`);
    let groups = await listDocuments<StudyGroup>(COLLECTIONS.STUDY_GROUPS, filters);

    if (search) {
      const q = search.toLowerCase();
      groups = groups.filter((g) => g.name.toLowerCase().includes(q));
    }

    return success(groups);
  } catch (err) {
    logError("StudyGroupsAdminService", err);
    return failure(err instanceof Error ? err.message : "Failed to discover groups");
  }
}
