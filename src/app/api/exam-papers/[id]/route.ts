import { UTApi } from "uploadthing/server";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import type { ExamPaper as ExamPaperData } from "@/types/exam-paper";

export const runtime = "nodejs";

const utapi = new UTApi();

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "ExamPaper",
	execute: async ({ params }) => {
		const id = params?.id as string;

		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);

		if (!doc) {
			throw new HttpError(404, "Exam paper not found");
		}

		const fileKeysRaw = doc.fileKeys as string;
		const fileKeys: Record<string, string> = fileKeysRaw
			? JSON.parse(fileKeysRaw)
			: {};

		if (!fileKeys.json) {
			throw new HttpError(404, "Parsed exam JSON not available");
		}

		const urlResult = await utapi.getFileUrls([fileKeys.json]);
		const urlData = urlResult.data || [];
		if (!urlData.length || !urlData[0]?.url) {
			throw new HttpError(404, "Exam JSON file not found on UploadThing");
		}

		const response = await fetch(urlData[0].url, { cache: "no-store" });
		if (!response.ok) {
			throw new HttpError(502, "Failed to fetch exam JSON");
		}

		const examPaper: ExamPaperData = await response.json();

		return {
			metadata: {
				id: doc.$id,
				subject: doc.subject,
				paperCode: doc.paperCode,
				examPeriod: doc.examPeriod,
				year: doc.year,
				grade: doc.grade,
				language: doc.language,
				totalMarks: doc.totalMarks,
				duration: doc.duration,
			},
			exam: examPaper,
		};
	},
});
