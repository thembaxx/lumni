import { ExamDownloadService } from "@/lib/admin";
import type { DownloadRequest } from "@/lib/admin/exam-download-service";
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "DownloadExamPapers",
  validate: (body) => {
    const { year, examTypes, subjectIds } = body as unknown as DownloadRequest;
    if (!year || !examTypes || !subjectIds) return "year, examTypes, and subjectIds are required";
    return null;
  },
  execute: async ({ body }) => {
    const request = body as unknown as DownloadRequest;
    const service = new ExamDownloadService();
    return service.download(request);
  },
});
