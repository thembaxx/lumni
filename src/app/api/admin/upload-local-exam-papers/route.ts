import { ExamUploadService } from "@/lib/admin";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "UploadLocalExamPapers",
  execute: async ({ body }) => {
    const { folderPath } = body as { folderPath?: string };
    const service = new ExamUploadService();
    try {
      return await service.upload(folderPath);
    } catch (err) {
      throw new HttpError(400, err instanceof Error ? err.message : "Upload failed");
    }
  },
});
