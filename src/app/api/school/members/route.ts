import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getSchoolMembers, isUserSchoolMember } from "@/lib/school/service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolMembers",
  execute: async ({ userId, req }) => {
    if (!userId) throw new HttpError(401, "Authentication required");

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");
    if (!schoolId) throw new HttpError(400, "schoolId query parameter is required");

    const membership = await isUserSchoolMember(schoolId, userId);
    if (!membership.isMember) throw new HttpError(403, "Not a member of this school");

    return getSchoolMembers(schoolId);
  },
});
