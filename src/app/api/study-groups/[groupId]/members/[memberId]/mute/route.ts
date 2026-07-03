import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { muteMember, unmuteMember } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "MuteMember",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;
    const memberId = params?.memberId as string;
    const result = await muteMember(userId as string, groupId, memberId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "UnmuteMember",
  execute: async ({ userId, params }) => {
    const groupId = params?.groupId as string;
    const memberId = params?.memberId as string;
    const result = await unmuteMember(userId as string, groupId, memberId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});
