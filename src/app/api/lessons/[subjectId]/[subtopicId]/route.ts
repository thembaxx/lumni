import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { generateLesson, getCachedLesson } from "@/lib/lesson/service";
import type { Lesson } from "@/lib/lesson/types";

export const GET = createRouteHandler({
  auth: "required",
  budget: "generate",
  execute: async ({ params }) => {
    const subjectId = params?.subjectId;
    const subtopicId = params?.subtopicId;

    if (!subjectId || !subtopicId) {
      throw new HttpError(400, "subjectId and subtopicId are required");
    }

    const cached = await getCachedLesson(subjectId, "", subtopicId);
    if (cached) return cached;

    const lesson = await generateLesson(subjectId, "", subtopicId);

    if (lesson.sections.length === 0) {
      return {
        id: "",
        subjectId: "",
        topicId: "",
        subtopicId: "",
        title: "",
        order: 0,
        prerequisites: [],
        sections: [],
        vocabulary: [],
        difficulty: "medium",
        estimatedMinutes: 0,
      } satisfies Lesson;
    }

    return lesson;
  },
  errorLabel: "LessonsRoute",
});
