import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { addSchoolMember, getSchoolMembers, isUserSchoolMember } from "@/lib/school/service";
import { z } from "zod";

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

const postSchema = z.object({
  schoolId: z.string(),
  userId: z.string(),
  role: z.enum(["teacher", "student"]),
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolMembersPost",
  execute: async ({ body, userId: callerId }) => {
    if (!callerId) throw new HttpError(401, "Authentication required");
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Invalid input");
    const { schoolId, userId: targetUserId, role } = parsed.data;
    const membership = await isUserSchoolMember(schoolId, callerId);
    if (
      !membership.isMember ||
      (membership.role !== "admin" && membership.role !== "teacher_manager")
    ) {
      throw new HttpError(403, "Not authorized");
    }
    const result = await addSchoolMember(schoolId, targetUserId, role);
    if (!result) throw new HttpError(500, "Failed to add member");
    return result;
  },
});
