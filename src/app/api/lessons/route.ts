import { createRouteHandler } from "@/lib/api/create-route-handler";
import { generateLesson, getCachedLesson, storeLesson } from "@/lib/lesson/service";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const GET = withRateLimit(
  createRouteHandler({
    auth: "none",
    execute: async ({ req }) => {
      const { searchParams } = new URL(req.url);
      const subject = searchParams.get("subject");
      const topic = searchParams.get("topic");
      const subtopic = searchParams.get("subtopic");

      if (!subject || !topic || !subtopic) {
        return {
          lesson: null,
          error: "subject, topic, and subtopic are required",
        };
      }

      const cached = await getCachedLesson(subject, topic, subtopic);
      if (cached) {
        return { lesson: cached, cached: true };
      }

      const lesson = await generateLesson(subject, topic, subtopic);
      if (lesson.sections.length === 0) {
        return { lesson: null, error: "Failed to generate lesson" };
      }

      await storeLesson(subject, topic, subtopic, lesson);
      return { lesson, cached: false };
    },
    errorLabel: "Lessons",
  }),
  { max: 10, windowMs: 60000 },
);
