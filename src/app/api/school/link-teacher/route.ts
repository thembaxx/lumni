import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { addSchoolMember, getSchool, isUserSchoolMember, lookupSchoolByCode } from "@/lib/school/service";
import { z } from "zod";

const schema = z.object({
  schoolCode: z.string().length(6).optional(),
  schoolId: z.string().optional(),
}).refine((data) => data.schoolCode || data.schoolId, {
  message: "Either schoolCode or schoolId must be provided",
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolLinkTeacher",
  useRateLimit: true,
  execute: async ({ body, userId }) => {
    if (!userId) throw new HttpError(401, "Authentication required");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues.map((e: { message: string }) => e.message).join(", "));
    }

    let schoolId = parsed.data.schoolId;

    if (parsed.data.schoolCode) {
      const lookup = await lookupSchoolByCode(parsed.data.schoolCode);
      if (!lookup.school) throw new HttpError(404, "Invalid or expired school code");
      schoolId = lookup.school.id;
    }

    if (!schoolId) throw new HttpError(400, "Could not resolve school");

    const membership = await isUserSchoolMember(schoolId, userId);
    if (membership.isMember) throw new HttpError(409, "Already a member of this school");

    const school = await getSchool(schoolId);
    if (!school) throw new HttpError(404, "School not found");
    if (school.seatsUsed >= school.seatCount) {
      throw new HttpError(403, "School has no available seats");
    }

    const member = await addSchoolMember(schoolId, userId, "teacher");
    if (!member) throw new HttpError(500, "Failed to add teacher to school");

    return {
      schoolId,
      schoolName: school.name,
      role: "teacher",
      status: "active",
    };
  },
});
