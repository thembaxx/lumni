import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const POST = createRouteHandler({
  auth: "admin",
  validate: (body: Record<string, unknown>) => {
    if (!body.fileKey) return "Missing fileKey";
    return null;
  },
  execute: async ({ body }) => {
    const { fileKey, subject, year, paperNumber, type, fileUrl, originalFileName } = body as Record<
      string,
      string
    >;

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, "unique()", {
      fileKey,
      subject,
      year: year ? Number(year) : new Date().getFullYear(),
      paperNumber: paperNumber ? Number(paperNumber) : 1,
      type: type || "exam",
      fileUrl: fileUrl || "",
      originalFileName: originalFileName || fileKey || "uploaded_exam_paper.pdf",
      uploadedAt: new Date().toISOString(),
    });

    return { success: true };
  },
  errorLabel: "Upload exam paper",
});
