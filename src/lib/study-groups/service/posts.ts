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
import type { CreatePostInput, GroupPost } from "../types";

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
    return failure(err instanceof Error ? err.message : "Failed to create post");
  }
}

export async function getGroupPosts(groupId: string): Promise<ServiceResult<GroupPost[]>> {
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

export async function deletePost(userId: string, postId: string): Promise<ServiceResult<void>> {
  try {
    const post = await getDocument<GroupPost>(COLLECTIONS.GROUP_POSTS, postId);
    if (!post) return failure("Post not found");
    if (post.userId !== userId) return failure("Not authorized to delete this post");
    await deleteDocument(COLLECTIONS.GROUP_POSTS, postId);
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to delete post");
  }
}
