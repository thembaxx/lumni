import type { Models } from "node-appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { databases } from "@/lib/server/appwrite";

export const runtime = "nodejs";

export const GET = createRouteHandler({
	auth: "admin",
	errorLabel: "List Exams",
	execute: async () => {
		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
		);

		const exams = response.documents.map((doc: any) => ({
			id: doc.$id,
			subject: doc.subject,
			paperCode: doc.paperCode,
			examPeriod: doc.examPeriod,
			year: doc.year,
			grade: doc.grade,
			language: doc.language,
			totalMarks: doc.totalMarks,
			duration: doc.duration,
			fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
			uploadedAt: doc.uploadedAt,
		}));

		return { exams, total: exams.length };
	},
});
