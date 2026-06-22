import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
  getTeacherEngagementStats,
  getTeacherStudents,
  getTeacherTopicMastery,
} from "@/lib/server/teacher-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "TeacherStudents",
  execute: async ({ userId }) => {
    const [students, topicMastery, engagement] = await Promise.all([
      getTeacherStudents(userId as string),
      getTeacherTopicMastery(userId as string),
      getTeacherEngagementStats(userId as string),
    ]);

    return { students, topicMastery, engagement };
  },
});
