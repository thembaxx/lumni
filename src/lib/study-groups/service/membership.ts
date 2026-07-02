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
import type { GroupMember, GroupRole, StudyGroup } from "../types";

export async function getGroupMembers(groupId: string): Promise<ServiceResult<GroupMember[]>> {
  try {
    const members = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
      `groupId=${groupId}`,
    ]);
    return success(members);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load members");
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

    const existing = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
      `groupId=${group.$id}`,
      `userId=${userId}`,
    ]);
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

export async function leaveGroup(userId: string, groupId: string): Promise<ServiceResult<void>> {
  try {
    const members = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
      `groupId=${groupId}`,
      `userId=${userId}`,
    ]);
    if (members.length === 0) return failure("Not a member of this group");

    await deleteDocument(COLLECTIONS.GROUP_MEMBERS, members[0].$id);

    const group = await getDocument<StudyGroup>(COLLECTIONS.STUDY_GROUPS, groupId);
    if (group) {
      const newCount = Math.max(0, (group.memberCount ?? 1) - 1);
      await updateDocument(COLLECTIONS.STUDY_GROUPS, groupId, {
        memberCount: newCount,
      });
    }

    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to leave group");
  }
}
