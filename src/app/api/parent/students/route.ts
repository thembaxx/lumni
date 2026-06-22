import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
  getChildActivityTimeline,
  getChildSubjectProgress,
  getParentStudents,
} from "@/lib/server/parent-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "ParentStudents",
  execute: async ({ userId }) => {
    const students = await getParentStudents(userId as string);

    const childrenData = await Promise.all(
      students.map(async (s) => {
        const [subjects, activities] = await Promise.all([
          getChildSubjectProgress(s.id, true, true),
          getChildActivityTimeline(s.id),
        ]);
        return { student: s, subjects, activities };
      }),
    );

    return { children: childrenData };
  },
});
