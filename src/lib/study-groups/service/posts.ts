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
import type { CreatePostInput, GroupMember, GroupPost } from "../types";

async function isMuted(userId: string, groupId: string): Promise<boolean> {
  const members = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
    `groupId=${groupId}`,
    `userId=${userId}`,
  ]);
  if (members.length === 0) return false;
  return !!members[0].isMuted;
}

export async function createPost(
  userId: string,
  userName: string | undefined,
  input: CreatePostInput,
): Promise<ServiceResult<GroupPost>> {
  try {
    if (await isMuted(userId, input.groupId))
      return failure("You are muted in this group and cannot post");

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

    if (post.userId !== userId) {
      const members = await listDocuments<GroupMember>(COLLECTIONS.GROUP_MEMBERS, [
        `groupId=${post.groupId}`,
        `userId=${userId}`,
      ]);
      if (members.length === 0 || (members[0].role !== "admin" && members[0].role !== "co-admin"))
        return failure("Not authorized to delete this post");
    }

    await deleteDocument(COLLECTIONS.GROUP_POSTS, postId);
    return success(undefined);
  } catch (err) {
    logError("StudyGroupsService", err);
    return failure(err instanceof Error ? err.message : "Failed to delete post");
  }
}
