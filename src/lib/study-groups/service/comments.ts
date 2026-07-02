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
import type { GroupComment } from "../types";

export async function getPostComments(postId: string): Promise<ServiceResult<GroupComment[]>> {
  try {
    const comments = await listDocuments<GroupComment>(COLLECTIONS.GROUP_COMMENTS, [
      `postId=${postId}`,
      `orderAsc=createdAt`,
    ]);
    return success(comments);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to load comments");
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
    const comment = await getDocument<GroupComment>(COLLECTIONS.GROUP_COMMENTS, commentId);
    if (!comment) return failure("Failed to create comment");
    return success(comment);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to create comment");
  }
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<ServiceResult<void>> {
  try {
    const comment = await getDocument<GroupComment>(COLLECTIONS.GROUP_COMMENTS, commentId);
    if (!comment) return failure("Comment not found");
    if (comment.userId !== userId) return failure("Not authorized");
    await deleteDocument(COLLECTIONS.GROUP_COMMENTS, commentId);
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to delete comment");
  }
}
