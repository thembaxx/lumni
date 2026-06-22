import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getGroupBadges } from "@/lib/study-groups/challenge-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "GroupBadges",
  execute: async ({ params }) => {
    const groupId = params?.groupId as string;
    const result = await getGroupBadges(groupId);

    if (!result.success) {
      throw new HttpError(500, result.error);
    }

    return { badges: result.data };
  },
});
