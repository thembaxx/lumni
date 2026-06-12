import { UTApi, UTFile } from "uploadthing/server";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { MarkdownExamParser } from "@/lib/exam-parser/markdown-exam-parser";
import { databases } from "@/lib/server/appwrite";
import { getExamMarkdown } from "@/lib/server/exam-markdown";
import { logError } from "@/lib/shared/logger";
import type { ExamPaper as ExamPaperData } from "@/types/exam-paper";

export const runtime = "nodejs";

const utapi = new UTApi();

function parseFileKeys(raw: string | undefined | null): Record<string, string> {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed.length > 0 ? { pdf: parsed[0] } : {};
		}
		if (typeof parsed === "object" && parsed !== null) {
			return parsed as Record<string, string>;
		}
	} catch {
		// Invalid JSON — treat as empty
	}
	return {};
}

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

		const metadata = {
			id: doc.$id,
			subject: doc.subject,
			paperCode: doc.paperCode,
			examPeriod: doc.examPeriod,
			year: doc.year,
			grade: doc.grade,
			language: doc.language,
			totalMarks: doc.totalMarks,
			duration: doc.duration,
		};

		const fileKeys = parseFileKeys(doc.fileKeys as string | undefined | null);

		// Fast path: pre-converted JSON already exists on UploadThing
		if (fileKeys.json) {
			try {
				const urlResult = await utapi.getFileUrls([fileKeys.json]);
				const urlData = urlResult.data || [];
				if (urlData.length && urlData[0]?.url) {
					const response = await fetch(urlData[0].url, { cache: "no-store" });
					if (response.ok) {
						const examPaper: ExamPaperData = await response.json();
						return { metadata, exam: examPaper };
					}
				}
			} catch (err) {
				logError("ExamPaper-fast-path", err);
			}
		}

		// Lazy fallback: convert PDF → markdown (via markdown.new) → ExamPaper JSON
		const fileUrl = doc.fileUrl as string | undefined;
		const originalFileName =
			(doc.originalFileName as string) || `paper-${id}.pdf`;

		if (!fileUrl) {
			throw new HttpError(
				404,
				"Parsed exam JSON not available and no PDF URL found for conversion",
			);
		}

		const mdResult = await getExamMarkdown(fileUrl);
		if (mdResult.source === "error" || !mdResult.content) {
			logError(
				"ExamPaper-markdown-fallback",
				mdResult.error || "Unknown error",
			);
			throw new HttpError(502, "Failed to convert exam paper to markdown");
		}

		let examPaper: ExamPaperData;
		try {
			const parser = new MarkdownExamParser(mdResult.content, originalFileName);
			examPaper = parser.parse();
		} catch (err) {
			logError("ExamPaper-parse", err);
			throw new HttpError(502, "Failed to parse exam markdown into questions");
		}

		// Upload parsed JSON to UploadThing for future fast-path lookups
		try {
			const jsonFileName = originalFileName.replace(/\.pdf$/i, ".json");
			const jsonBuffer = Buffer.from(JSON.stringify(examPaper));
			const jsonUploadFile = new UTFile(
				[new Uint8Array(jsonBuffer)],
				jsonFileName,
			);
			const jsonUploadResult = await utapi.uploadFiles(jsonUploadFile);

			if (jsonUploadResult?.data) {
				const updatedFileKeys: Record<string, string> = {
					...fileKeys,
					json: jsonUploadResult.data.key,
				};
				await databases.updateDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_PAPERS,
					id,
					{ fileKeys: JSON.stringify(updatedFileKeys) },
				);
			}
		} catch (err) {
			logError("ExamPaper-json-persist", err);
		}

		return { metadata, exam: examPaper };
	},
});
