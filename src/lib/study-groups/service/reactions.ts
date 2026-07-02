import {
  COLLECTIONS,
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
} from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import type { ServiceResult } from "@/lib/shared/service-result";
import { failure, success } from "@/lib/shared/service-result";
import type { GroupReaction } from "../types";

export async function getPostReactions(postId: string): Promise<ServiceResult<GroupReaction[]>> {
  try {
    const reactions = await listDocuments<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, [
      `postId=${postId}`,
    ]);
    return success(reactions);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load reactions");
  }
}

export async function getCommentReactions(
  commentId: string,
): Promise<ServiceResult<GroupReaction[]>> {
  try {
    const reactions = await listDocuments<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, [
      `commentId=${commentId}`,
    ]);
    return success(reactions);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load reactions");
  }
}

export async function togglePostReaction(
  userId: string,
  postId: string,
  emoji: string,
): Promise<ServiceResult<GroupReaction | null>> {
  try {
    const existing = await listDocuments<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, [
      `postId=${postId}`,
      `userId=${userId}`,
      `emoji=${emoji}`,
    ]);
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
    const reaction = await getDocument<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, reactionId);
    return success(reaction ?? null);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to toggle reaction");
  }
}

export async function toggleCommentReaction(
  userId: string,
  commentId: string,
  emoji: string,
): Promise<ServiceResult<GroupReaction | null>> {
  try {
    const existing = await listDocuments<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, [
      `commentId=${commentId}`,
      `userId=${userId}`,
      `emoji=${emoji}`,
    ]);
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
    const reaction = await getDocument<GroupReaction>(COLLECTIONS.GROUP_REACTIONS, reactionId);
    return success(reaction ?? null);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to toggle reaction");
  }
}
