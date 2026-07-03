import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
  deleteGroup,
  getGroupById,
  getGroupMembers,
  updateGroup,
} from "@/lib/study-groups/service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "StudyGroup",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;

    const membersResult = await getGroupMembers(groupId);
    const members = membersResult.success ? membersResult.data : [];
    const isMember = members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new HttpError(403, "Not a member of this group");
    }

    const groupResult = await getGroupById(groupId);
    if (!groupResult.success) {
      throw new HttpError(404, groupResult.error);
    }

    return { group: groupResult.data, members };
  },
});

export const PATCH = createRouteHandler({
  auth: "required",
  errorLabel: "UpdateGroup",
  execute: async ({ userId, params, body }) => {
    const groupId = params?.groupId as string;
    const { name, description, subjectId, visibility } = body as {
      name?: string;
      description?: string;
      subjectId?: string;
      visibility?: "public" | "private";
    };

    const result = await updateGroup(userId as string, groupId, {
      name,
      description,
      subjectId,
      visibility,
    });

    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { group: result.data };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "StudyGroup",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;
    const result = await deleteGroup(userId as string, groupId);

    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});
