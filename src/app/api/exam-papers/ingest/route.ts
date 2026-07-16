import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { pastPaperIngestionService } from "@/lib/exam-paper-ingestion/ingestion-service";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "PastPaperIngest",
  useRateLimit: true,
  parseBody: async (req) => {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const configJson = formData.get("config") as string | null;
    const memoFile = formData.get("memo") as File | null;

    if (!file) throw new HttpError(400, "PDF file is required");
    if (!configJson) throw new HttpError(400, "Config is required");

    const config = JSON.parse(configJson);
    const buffer = Buffer.from(await file.arrayBuffer());
    const memoBuffer = memoFile ? Buffer.from(await memoFile.arrayBuffer()) : null;

    return {
      file: { buffer, name: file.name },
      config,
      memo: memoBuffer ? { buffer: memoBuffer, name: memoFile.name } : null,
    };
  },
  validate: (body) => {
    const { config } = body;
    if (!config.subject) return "Subject is required";
    if (!config.year || config.year < 2000 || config.year > 2030) return "Valid year required";
    if (!config.paperNumber || config.paperNumber < 1 || config.paperNumber > 3)
      return "Paper number must be 1-3";
    if (!config.examPeriod || !["may-june", "november"].includes(config.examPeriod))
      return "examPeriod must be may-june or november";
    return null;
  },
  execute: async ({ body, userId }) => {
    const { file, config, memo } = body as {
      file: { buffer: Buffer; name: string };
      config: {
        subject: string;
        year: number;
        paperNumber: number;
        examPeriod: "may-june" | "november";
        language: string;
        totalMarks: number;
        duration: string;
        autoPublish?: boolean;
      };
      memo?: { buffer: Buffer; name: string } | null;
    };

    try {
      // Get curriculum topics for the subject
      const { getCurriculumTopics } = await import("@/lib/exam-paper-ingestion/ingestion-service");
      const curriculumTopics = await getCurriculumTopics(config.subject);

      const fullConfig = {
        ...config,
        curriculumTopics,
        language: config.language || "en",
      };

      const result = await pastPaperIngestionService.ingestFromPdf(
        file.buffer,
        file.name,
        fullConfig,
      );

      // If memo provided and we have questions, process memo
      if (memo && result.questions.length > 0) {
        // Extract questions and re-ingest with memo
        // This would require storing the extracted questions and re-processing
        logError("PastPaperIngest", new Error("Memo processing not fully implemented"), {
          subject: config.subject,
          year: config.year,
        });
      }

      return {
        success: true,
        ...result,
        message: `Ingested ${result.totalPublished} of ${result.totalExtracted} questions`,
      };
    } catch (err) {
      logError("PastPaperIngest.execute", err);
      throw err;
    }
  },
});
