import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { pastPaperIngestionService } from "@/lib/exam-paper-ingestion/ingestion-service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "PastPaperIngestStructured",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (
      !body.metadata ||
      !body.metadata.subject ||
      !body.metadata.year ||
      !body.metadata.paperNumber
    ) {
      return "metadata with subject, year, paperNumber is required";
    }
    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      return "questions array is required";
    }
    return null;
  },
  execute: async ({ body, userId }) => {
    const {
      metadata,
      questions,
      examPeriod,
      language = "en",
    } = body as {
      metadata: {
        subject: string;
        year: number;
        paperNumber: number;
        totalMarks?: number;
        duration?: string;
        grade?: number;
      };
      questions: Array<{
        questionId: string;
        partId?: string;
        questionText: string;
        answerText?: string;
        marks?: number;
        questionType?: string;
        bloomLevel?: string;
      }>;
      examPeriod?: "may-june" | "november";
      language?: string;
    };

    if (!metadata || !questions) {
      throw new HttpError(400, "metadata and questions are required");
    }

    const curriculumTopics = await import("@/lib/exam-paper-ingestion/curriculum-topics").then(
      (m) => m.getCurriculumTopics(metadata.subject),
    );

    const config = {
      subject: metadata.subject,
      year: metadata.year,
      paperNumber: metadata.paperNumber,
      totalMarks: metadata.totalMarks || 150,
      duration: metadata.duration || "3 hours",
      examPeriod: examPeriod || (metadata.paperNumber > 2 ? "may-june" : "november"),
      language,
      grade: metadata.grade || 12,
      curriculumTopics,
    };

    const result = await pastPaperIngestionService.ingestStructured(questions, config);

    return {
      success: true,
      ...result,
      message: `Published ${result.publishedCount} of ${questions.length} questions`,
    };
  },
});
