import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { assignCoAdmin, removeCoAdmin } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "AssignCoAdmin",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;
    const memberId = params?.memberId as string;
    const result = await assignCoAdmin(userId as string, groupId, memberId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "RemoveCoAdmin",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;
    const memberId = params?.memberId as string;
    const result = await removeCoAdmin(userId as string, groupId, memberId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});
