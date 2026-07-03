import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { discoverGroups } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
  auth: "optional",
  errorLabel: "DiscoverGroups",
  execute: async ({ req }) => {
    const { searchParams } = req.nextUrl;
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const result = await discoverGroups(subjectId, search);
    if (!result.success) {
      throw new HttpError(500, result.error);
    }
    return { groups: result.data };
  },
});
