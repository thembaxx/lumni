import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import {
  getTeacherEngagementStats,
  getTeacherStudents,
  getTeacherTopicMastery,
} from "@/lib/server/teacher-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherStudents",
  execute: async ({ userId }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const [students, topicMastery, engagement] = await Promise.all([
      getTeacherStudents(userId as string),
      getTeacherTopicMastery(userId as string),
      getTeacherEngagementStats(userId as string),
    ]);

    return { students, topicMastery, engagement };
  },
});
